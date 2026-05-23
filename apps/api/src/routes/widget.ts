import { Hono } from "hono";
import { workspaces } from "@helia/db";
import { eq } from "drizzle-orm";
import { db } from "../lib/state";

export const widgetRouter = new Hono();

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * GET /v1/widget/config?ws=<uuid>
 *
 * Public endpoint consumed by the widget on every page load. Returns just
 * enough to render the launcher and panel with the workspace's branding.
 */
widgetRouter.get("/config", async (c) => {
  const ws = c.req.query("ws");
  if (!ws || !UUID_RE.test(ws)) {
    return c.json({ error: "ws query param required" }, 400);
  }

  const [workspace] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.id, ws))
    .limit(1);

  if (!workspace) return c.json({ error: "workspace not found" }, 404);

  c.header("Cache-Control", "public, max-age=60, stale-while-revalidate=600");

  return c.json({
    workspace: { id: workspace.id, name: workspace.name },
    theme: {
      primary: workspace.brandPrimary,
      mode: workspace.widgetTheme,
      radius: workspace.widgetRadius,
    },
    layout: {
      position: workspace.widgetPosition,
    },
    bot: {
      name: workspace.botName,
      subtitle: workspace.botSubtitle,
      greeting: workspace.botGreeting,
      placeholder: workspace.botPlaceholder,
      suggestions: workspace.botSuggestions,
    },
  });
});
