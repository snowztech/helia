import type { Context } from "hono";
import type { Workspace } from "@helia/db";

/**
 * Per-workspace embed origin check.
 *
 * Browsers do their own CORS dance, but CORS is advisory — a custom
 * client (curl, server-to-server) can ignore it. Real security is this
 * server-side check on widget-facing routes (chat, widget config).
 *
 * Returns null when the request passes, or a 403 Response when it doesn't.
 *
 * Empty allowedOrigins = allow any origin (open assistants, dev).
 * Owners lock it down once they know which domains they embed on.
 */
export function checkWorkspaceOrigin(
  c: Context,
  workspace: Pick<Workspace, "allowedOrigins">,
): Response | null {
  if (workspace.allowedOrigins.length === 0) return null;

  const origin = c.req.header("origin")?.replace(/\/+$/, "");
  if (!origin) {
    return c.json({ error: "origin header required" }, 403);
  }
  if (!workspace.allowedOrigins.includes(origin)) {
    return c.json({ error: "origin not allowed for this workspace" }, 403);
  }
  return null;
}
