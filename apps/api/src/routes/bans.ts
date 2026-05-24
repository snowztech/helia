import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { bannedUsers } from "@helia/db";
import { and, desc, eq } from "drizzle-orm";
import { db } from "../lib/state";
import { currentUser, currentWorkspace } from "../lib/auth";

export const bansRouter = new Hono();

/**
 * GET /v1/banned-users
 *
 * Workspace-scoped list of banned end-users, newest first. Powers the
 * Banned users section in /settings.
 */
bansRouter.get("/", async (c) => {
  const ws = currentWorkspace(c);
  const rows = await db
    .select()
    .from(bannedUsers)
    .where(eq(bannedUsers.workspaceId, ws.id))
    .orderBy(desc(bannedUsers.bannedAt));
  return c.json({ bans: rows });
});

const PostBody = z.object({
  userId: z.string().min(1).max(200),
  userName: z.string().max(200).nullable().optional(),
  reason: z.string().max(500).nullable().optional(),
});

/**
 * POST /v1/banned-users
 *
 * Idempotent. Re-banning an existing user updates the reason instead of
 * erroring; that's the natural UX from a "ban with new reason" click.
 */
bansRouter.post("/", zValidator("json", PostBody), async (c) => {
  const ws = currentWorkspace(c);
  const me = currentUser(c);
  const body = c.req.valid("json");

  const [row] = await db
    .insert(bannedUsers)
    .values({
      workspaceId: ws.id,
      userId: body.userId,
      reason: body.reason ?? null,
      bannedBy: me?.id ?? null,
    })
    .onConflictDoUpdate({
      target: [bannedUsers.workspaceId, bannedUsers.userId],
      set: { reason: body.reason ?? null, bannedAt: new Date() },
    })
    .returning();

  return c.json({ ban: row }, 201);
});

bansRouter.delete("/:userId", async (c) => {
  const ws = currentWorkspace(c);
  const userId = c.req.param("userId");

  const result = await db
    .delete(bannedUsers)
    .where(
      and(
        eq(bannedUsers.workspaceId, ws.id),
        eq(bannedUsers.userId, userId),
      ),
    )
    .returning({ userId: bannedUsers.userId });

  if (result.length === 0) return c.json({ error: "not banned" }, 404);
  return c.json({ ok: true });
});
