import { Hono } from "hono";
import { chatTraces } from "@helia/db";
import { desc, eq } from "drizzle-orm";
import { db } from "../lib/state";
import { currentWorkspace } from "../lib/auth";

export const conversationsRouter = new Hono();

/**
 * GET /v1/conversations
 *
 * Recent chat traces for the admin dashboard. Returns the lightweight
 * fields needed for a list view. Detail (steps, full retrieval) is a
 * separate fetch by id.
 */
conversationsRouter.get("/", async (c) => {
  const limit = Math.min(
    Math.max(Number(c.req.query("limit") ?? 20), 1),
    100,
  );
  const ws = currentWorkspace(c);

  const rows = await db
    .select({
      id: chatTraces.id,
      userMessage: chatTraces.userMessage,
      finalAnswer: chatTraces.finalAnswer,
      totalTokens: chatTraces.totalTokens,
      totalLatencyMs: chatTraces.totalLatencyMs,
      model: chatTraces.model,
      sourceCount: chatTraces.retrieval,
      error: chatTraces.error,
      createdAt: chatTraces.createdAt,
    })
    .from(chatTraces)
    .where(eq(chatTraces.workspaceId, ws.id))
    .orderBy(desc(chatTraces.createdAt))
    .limit(limit);

  return c.json({
    conversations: rows.map((r) => ({
      id: r.id,
      userMessage: r.userMessage,
      finalAnswer: r.finalAnswer,
      totalTokens: r.totalTokens,
      totalLatencyMs: r.totalLatencyMs,
      model: r.model,
      sourceCount: Array.isArray(r.sourceCount) ? r.sourceCount.length : 0,
      error: r.error,
      createdAt: r.createdAt,
    })),
  });
});
