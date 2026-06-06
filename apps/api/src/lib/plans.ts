import { eq, sql } from "drizzle-orm";
import { sources, type Workspace } from "@helia/db";
import { db, HELIA_MODE } from "./state";

export const FREE_SOURCE_LIMIT = 3;
export const STARTER_SOURCE_LIMIT = 50;

export function sourceLimitFor(ws: Workspace): number | null {
  if (HELIA_MODE !== "hosted") return null;
  return ws.plan === "starter" ? STARTER_SOURCE_LIMIT : FREE_SOURCE_LIMIT;
}

export function toolsAllowed(ws: Workspace): boolean {
  if (HELIA_MODE !== "hosted") return true;
  return (
    ws.plan === "starter" &&
    (ws.billingStatus === "active" || ws.billingStatus === "trialing")
  );
}

export async function sourceCount(workspaceId: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(sources)
    .where(eq(sources.workspaceId, workspaceId));
  return row?.count ?? 0;
}

export async function sourceLimitError(
  ws: Workspace,
): Promise<{ error: string; limit: number; used: number } | null> {
  const limit = sourceLimitFor(ws);
  if (limit === null) return null;
  const used = await sourceCount(ws.id);
  if (used < limit) return null;
  return {
    error: `Source limit reached for ${ws.plan === "starter" ? "Starter" : "Free"}. Upgrade to Starter for more sources.`,
    limit,
    used,
  };
}
