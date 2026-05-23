import { Hono } from "hono";
import { chatTraces } from "@helia/db";
import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "../lib/state";
import { currentWorkspace } from "../lib/auth";

export const metricsRouter = new Hono();

/**
 * GET /v1/metrics
 *
 * Workspace-scoped counts for the admin dashboard. One round trip per
 * window, no per-page joins.
 */
metricsRouter.get("/", async (c) => {
  const ws = currentWorkspace(c);
  const now = Date.now();
  const dayAgo = new Date(now - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

  const [todayRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(chatTraces)
    .where(
      and(
        eq(chatTraces.workspaceId, ws.id),
        gte(chatTraces.createdAt, dayAgo),
      ),
    );

  const [weekRow] = await db
    .select({
      count: sql<number>`count(*)::int`,
      avgLatency: sql<number>`coalesce(avg(total_latency_ms), 0)::int`,
      totalTokens: sql<number>`coalesce(sum(total_tokens), 0)::int`,
    })
    .from(chatTraces)
    .where(
      and(
        eq(chatTraces.workspaceId, ws.id),
        gte(chatTraces.createdAt, weekAgo),
      ),
    );

  const [totalRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(chatTraces)
    .where(eq(chatTraces.workspaceId, ws.id));

  return c.json({
    messagesToday: todayRow?.count ?? 0,
    messagesWeek: weekRow?.count ?? 0,
    messagesTotal: totalRow?.count ?? 0,
    avgLatencyMs: weekRow?.avgLatency ?? 0,
    tokensWeek: weekRow?.totalTokens ?? 0,
  });
});
