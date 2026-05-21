import { workspaces } from "@helia/db";
import { db } from "./state";

/**
 * Spike: single default workspace. Replaced by real auth/tenancy in Phase 2.
 */
export async function defaultWorkspaceId(): Promise<string> {
  const [ws] = await db.select().from(workspaces).limit(1);
  if (!ws) throw new Error("No workspace. Run: pnpm db:init");
  return ws.id;
}

export async function defaultWorkspace() {
  const [ws] = await db.select().from(workspaces).limit(1);
  if (!ws) throw new Error("No workspace. Run: pnpm db:init");
  return ws;
}
