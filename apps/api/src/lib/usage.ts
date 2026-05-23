import { and, eq, gte, sql } from "drizzle-orm";
import { chatTraces } from "@helia/db";
import { db } from "./state";

/**
 * Tokens billed against a workspace's monthly quota. Sums `total_tokens`
 * on chat_traces since the 1st of the current month (UTC).
 *
 * One synchronous query per chat request. Cheap on the indexed
 * (workspace_id, created_at) pair. If this ever shows up in latency,
 * cache it on the workspace row and update on trace insert.
 */
export async function tokensUsedThisMonth(workspaceId: string): Promise<number> {
  const now = new Date();
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0),
  );

  const [row] = await db
    .select({ total: sql<number>`coalesce(sum(total_tokens), 0)::int` })
    .from(chatTraces)
    .where(
      and(
        eq(chatTraces.workspaceId, workspaceId),
        gte(chatTraces.createdAt, start),
      ),
    );

  return row?.total ?? 0;
}

export function monthResetAt(): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0),
  );
}
