import { Hono } from "hono";
import { chatTraces } from "@helia/db";
import { and, asc, desc, eq, isNotNull, isNull, sql } from "drizzle-orm";
import { db } from "../lib/state";
import { currentWorkspace } from "../lib/auth";

export const conversationsRouter = new Hono();

/**
 * GET /v1/conversations
 *
 * One row per *conversation* (not per turn). The widget tags every chat
 * call with a `conversation_id`, and we group by it here to show the
 * admin a list of real chats rather than a flood of isolated turns.
 *
 * Each row carries the latest turn's preview, the count of turns, who
 * the user is (if identified), and the last-active timestamp. The detail
 * endpoint returns the full ordered transcript.
 */
conversationsRouter.get("/", async (c) => {
  const limit = Math.min(
    Math.max(Number(c.req.query("limit") ?? 50), 1),
    200,
  );
  const ws = currentWorkspace(c);
  const errorsOnly = c.req.query("errors") === "true";

  // Group by conversation_id. Rows without one (legacy or anonymous) are
  // surfaced as single-turn conversations keyed by the trace id.
  const groupKey = sql<string>`coalesce(${chatTraces.conversationId}::text, ${chatTraces.id}::text)`;

  const where = errorsOnly
    ? and(eq(chatTraces.workspaceId, ws.id), isNotNull(chatTraces.error))
    : eq(chatTraces.workspaceId, ws.id);

  const rows = await db
    .select({
      key: groupKey,
      lastAt: sql<string>`max(${chatTraces.createdAt})`.as("last_at"),
      turns: sql<number>`count(*)::int`.as("turns"),
      hasError: sql<boolean>`bool_or(${chatTraces.error} is not null)`.as(
        "has_error",
      ),
      // Subquery-free latest preview via DISTINCT ON would be more efficient.
      // For v1 sizes (under ~10k traces per workspace) the array_agg + order
      // is fine and keeps the SQL portable.
      lastUserMessage: sql<string>`(array_agg(${chatTraces.userMessage} order by ${chatTraces.createdAt} desc))[1]`.as(
        "last_user_message",
      ),
      userName: sql<string | null>`(array_agg(${chatTraces.userName} order by ${chatTraces.createdAt} desc))[1]`.as(
        "user_name",
      ),
      userId: sql<string | null>`(array_agg(${chatTraces.userId} order by ${chatTraces.createdAt} desc))[1]`.as(
        "user_id",
      ),
    })
    .from(chatTraces)
    .where(where)
    .groupBy(groupKey)
    .orderBy(desc(sql`max(${chatTraces.createdAt})`))
    .limit(limit);

  return c.json({
    conversations: rows.map((r) => ({
      id: r.key,
      userId: r.userId,
      userName: r.userName,
      lastUserMessage: r.lastUserMessage,
      turns: r.turns,
      hasError: r.hasError,
      lastActiveAt: r.lastAt,
    })),
  });
});

/**
 * GET /v1/conversations/:id
 *
 * The full transcript for one conversation, oldest-first. Supports two
 * id shapes:
 *   - A conversation_id (UUID) → returns every trace tagged with it
 *   - A trace id (for traces that pre-date the conversation grouping) →
 *     returns just that single row
 *
 * Tenant-scoped so a session can only ever read its own workspace.
 */
conversationsRouter.get("/:id", async (c) => {
  const ws = currentWorkspace(c);
  const id = c.req.param("id");

  // Try as a conversation_id first (multi-turn case).
  const byConv = await db
    .select()
    .from(chatTraces)
    .where(
      and(
        eq(chatTraces.workspaceId, ws.id),
        eq(chatTraces.conversationId, id),
      ),
    )
    .orderBy(asc(chatTraces.createdAt));

  if (byConv.length > 0) {
    return c.json({ conversation: toConversation(id, byConv) });
  }

  // Fall back to single trace id (legacy / anonymous rows that have no
  // conversation_id).
  const [singleTurn] = await db
    .select()
    .from(chatTraces)
    .where(
      and(
        eq(chatTraces.id, id),
        eq(chatTraces.workspaceId, ws.id),
        isNull(chatTraces.conversationId),
      ),
    )
    .limit(1);

  if (!singleTurn) return c.json({ error: "not found" }, 404);
  return c.json({ conversation: toConversation(id, [singleTurn]) });
});

/**
 * DELETE /v1/conversations/:id
 *
 * Removes every turn for the conversation. Accepts either a
 * `conversation_id` or a single trace id (for legacy single-turn rows).
 */
conversationsRouter.delete("/:id", async (c) => {
  const ws = currentWorkspace(c);
  const id = c.req.param("id");

  const byConv = await db
    .delete(chatTraces)
    .where(
      and(
        eq(chatTraces.workspaceId, ws.id),
        eq(chatTraces.conversationId, id),
      ),
    )
    .returning({ id: chatTraces.id });

  if (byConv.length > 0) return c.json({ ok: true, deleted: byConv.length });

  const single = await db
    .delete(chatTraces)
    .where(
      and(
        eq(chatTraces.id, id),
        eq(chatTraces.workspaceId, ws.id),
        isNull(chatTraces.conversationId),
      ),
    )
    .returning({ id: chatTraces.id });

  if (single.length === 0) return c.json({ error: "not found" }, 404);
  return c.json({ ok: true, deleted: single.length });
});

/**
 * DELETE /v1/conversations
 *
 * Wipes every conversation for the current workspace. The admin UI gates
 * this behind a typed-confirm dialog. Returns the count for the toast.
 */
conversationsRouter.delete("/", async (c) => {
  const ws = currentWorkspace(c);
  const rows = await db
    .delete(chatTraces)
    .where(eq(chatTraces.workspaceId, ws.id))
    .returning({ id: chatTraces.id });
  return c.json({ ok: true, deleted: rows.length });
});

function toConversation(
  id: string,
  rows: Array<typeof chatTraces.$inferSelect>,
) {
  const first = rows[0]!;
  const last = rows[rows.length - 1]!;
  return {
    id,
    userId: last.userId,
    userName: last.userName,
    model: last.model,
    startedAt: first.createdAt,
    lastActiveAt: last.createdAt,
    totalTokens: rows.reduce((n, r) => n + (r.totalTokens ?? 0), 0),
    turns: rows.map((r) => ({
      id: r.id,
      userMessage: r.userMessage,
      finalAnswer: r.finalAnswer,
      totalTokens: r.totalTokens,
      totalLatencyMs: r.totalLatencyMs,
      model: r.model,
      retrieval: r.retrieval ?? [],
      steps: r.steps ?? [],
      error: r.error,
      createdAt: r.createdAt,
    })),
  };
}
