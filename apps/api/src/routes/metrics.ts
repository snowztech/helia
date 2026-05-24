import { Hono } from "hono";
import { chatTraces } from "@helia/db";
import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "../lib/state";
import { currentWorkspace } from "../lib/auth";
import { monthResetAt, tokensUsedThisMonth } from "../lib/usage";

export const metricsRouter = new Hono();

/**
 * GET /v1/metrics/usage
 *
 * Token usage this month + the workspace's quota. Renders the Settings →
 * Limits card and any future "approaching limit" banner.
 */
metricsRouter.get("/usage", async (c) => {
  const ws = currentWorkspace(c);
  const used = await tokensUsedThisMonth(ws.id);
  return c.json({
    tokensUsedMonth: used,
    tokenQuotaMonthly: ws.tokenQuotaMonthly,
    monthResetsAt: monthResetAt().toISOString(),
  });
});

/**
 * GET /v1/metrics
 *
 * Workspace-scoped counts for the admin dashboard. One round trip per
 * window, no per-page joins.
 *
 * "Conversations" = distinct conversation_id, matching the grouping the
 * /conversations list uses. Legacy rows with no conversation_id fall back
 * to the trace id (each is its own single-turn conversation), so totals
 * line up with what the UI shows.
 */
metricsRouter.get("/", async (c) => {
  const ws = currentWorkspace(c);
  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  // Start of the current month in UTC, matching the token-quota window so
  // every monthly number on the dashboard rolls over together.
  const monthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0),
  );

  const distinctConv = sql<number>`count(distinct coalesce(${chatTraces.conversationId}::text, ${chatTraces.id}::text))::int`;
  const turnsCount = sql<number>`count(*)::int`;

  const [todayRow] = await db
    .select({ conversations: distinctConv, messages: turnsCount })
    .from(chatTraces)
    .where(
      and(
        eq(chatTraces.workspaceId, ws.id),
        gte(chatTraces.createdAt, dayAgo),
      ),
    );

  const [monthRow] = await db
    .select({
      conversations: distinctConv,
      messages: turnsCount,
      avgLatency: sql<number>`coalesce(avg(total_latency_ms), 0)::int`,
      totalTokens: sql<number>`coalesce(sum(total_tokens), 0)::int`,
    })
    .from(chatTraces)
    .where(
      and(
        eq(chatTraces.workspaceId, ws.id),
        gte(chatTraces.createdAt, monthStart),
      ),
    );

  const [totalRow] = await db
    .select({ conversations: distinctConv, messages: turnsCount })
    .from(chatTraces)
    .where(eq(chatTraces.workspaceId, ws.id));

  return c.json({
    conversationsToday: todayRow?.conversations ?? 0,
    conversationsMonth: monthRow?.conversations ?? 0,
    conversationsTotal: totalRow?.conversations ?? 0,
    messagesToday: todayRow?.messages ?? 0,
    messagesMonth: monthRow?.messages ?? 0,
    messagesTotal: totalRow?.messages ?? 0,
    avgLatencyMs: monthRow?.avgLatency ?? 0,
    tokensMonth: monthRow?.totalTokens ?? 0,
  });
});
