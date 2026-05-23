import { tool } from "ai";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import type { AgentToolSet } from "@helia/agent";
import { tools as toolsTable } from "@helia/db";
import { retrieve } from "@helia/rag";
import { db, log } from "../lib/state";
import { buildHttpTool } from "./http-tool";
import type { Identity } from "../routes/chat";

/**
 * Concrete tool implementations for a workspace.
 *
 * The built-in `search_knowledge` is always available. On top of that we
 * load any HTTP tools the workspace owner registered, build an AI SDK tool
 * for each, and merge them into the set the agent sees this turn.
 *
 * Tools are tenant-scoped at construction time; nothing leaks across
 * workspaces because we filter `tools.workspaceId` before building.
 */
export async function makeAgentTools(
  workspaceId: string,
  identity: Identity | null,
): Promise<AgentToolSet> {
  const result: AgentToolSet = {
    search_knowledge: tool({
      description:
        "Search the business's knowledge base (uploaded documents, FAQs, and crawled website pages). Returns the most relevant text chunks with their source title and a relevance score. Call this for any factual question that might be answered by the docs.",
      parameters: z.object({
        query: z
          .string()
          .min(2)
          .describe(
            "Concise keyword-rich search query. Reformulate the user's question if needed — short queries with the key nouns work best.",
          ),
      }),
      execute: async ({ query }) => {
        const chunks = await retrieve(db, workspaceId, query, {
          finalTop: 5,
          minScore: 0.005,
        });
        if (chunks.length === 0) {
          return {
            query,
            results: [],
            note: "No relevant chunks found. Tell the user honestly that the knowledge base does not cover this.",
          };
        }
        return {
          query,
          results: chunks.map((c, i) => ({
            index: i + 1,
            chunkId: c.id,
            title: c.metadata?.docTitle ?? c.metadata?.url ?? "source",
            url: c.metadata?.url ?? null,
            score: Number(c.score.toFixed(4)),
            content: c.content,
          })),
        };
      },
    }),
  };

  const httpTools = await db
    .select()
    .from(toolsTable)
    .where(
      and(eq(toolsTable.workspaceId, workspaceId), eq(toolsTable.enabled, true)),
    );

  for (const t of httpTools) {
    if (result[t.name]) {
      log.warn(
        { tool: t.name },
        "skipping HTTP tool with reserved name",
      );
      continue;
    }
    result[t.name] = buildHttpTool(t, identity);
  }

  return result;
}
