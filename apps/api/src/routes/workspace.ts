import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { workspaces } from "@helia/db";
import { eq } from "drizzle-orm";
import { db } from "../lib/state";
import { defaultWorkspace } from "../lib/workspace";

export const workspaceRouter = new Hono();

/**
 * GET /v1/workspace
 *
 * Returns the current workspace (single-workspace MVP — auth lands later).
 */
workspaceRouter.get("/", async (c) => {
  const ws = await defaultWorkspace();
  return c.json({ workspace: ws });
});

const PatchBody = z.object({
  name: z.string().min(1).max(80).optional(),
  brandPrimary: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "expected hex color like #0ea5e9")
    .optional(),
  botName: z.string().min(1).max(40).optional(),
  botSubtitle: z.string().max(120).optional(),
  botGreeting: z.string().min(1).max(280).optional(),
  botPlaceholder: z.string().max(60).optional(),
  widgetPosition: z.enum(["bottom-right", "bottom-left"]).optional(),
  widgetTheme: z.enum(["light", "dark", "auto"]).optional(),
  widgetRadius: z.number().int().min(0).max(24).optional(),
  botSuggestions: z.array(z.string().min(1).max(120)).max(6).optional(),
});

/**
 * PATCH /v1/workspace
 *
 * Updates branding and persona on the current workspace.
 */
workspaceRouter.patch("/", zValidator("json", PatchBody), async (c) => {
  const patch = c.req.valid("json");
  const current = await defaultWorkspace();

  const [updated] = await db
    .update(workspaces)
    .set(patch)
    .where(eq(workspaces.id, current.id))
    .returning();

  return c.json({ workspace: updated });
});
