import { tool } from "ai";
import { z } from "zod";
import type { AgentToolSet } from "@helia/agent";
import { retrieve } from "@helia/rag";
import { db } from "../lib/state";

/**
 * Concrete tool implementations for the Helia support agent.
 *
 * Tools are bound to a workspace at construction time — every call is
 * automatically tenant-scoped. The generic agent loop in @helia/agent
 * stays workspace-agnostic; here is where the app-specific knowledge
 * (Postgres, RAG retrieval) plugs in.
 *
 * To add a new capability (book_appointment, escalate, create_ticket, …):
 *  1. Define it here with a `tool({ description, parameters, execute })`.
 *  2. The description is auto-surfaced to the LLM via the persona prompt
 *     — no other wiring required.
 */
export function makeAgentTools(workspaceId: string): AgentToolSet {
  return {
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
}
