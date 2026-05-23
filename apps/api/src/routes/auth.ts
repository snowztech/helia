import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { and, eq, isNull } from "drizzle-orm";
import {
  emailTokens,
  users,
  workspaceMembers,
  workspaces,
} from "@helia/db";
import { db, log } from "../lib/state";
import {
  clearSessionCookie,
  createSession,
  currentUser,
  destroySession,
  generateToken,
  hashPassword,
  setSessionCookie,
  signupOpen,
  verifyPassword,
} from "../lib/auth";
import { sendVerificationEmail } from "../lib/email";

export const authRouter = new Hono();

const SignupBody = z.object({
  email: z.string().email().max(120),
  password: z.string().min(8).max(120),
  name: z.string().min(1).max(80).optional(),
});

/**
 * POST /v1/auth/signup
 *
 * Creates a user + a fresh workspace (1:1 for v1) + a verification token.
 * Sends the verification link via Resend if configured, otherwise logs it
 * to stdout so dev / self-host can copy it.
 *
 * Disabled when HELIA_SIGNUP != "open".
 */
authRouter.post("/signup", zValidator("json", SignupBody), async (c) => {
  if (!signupOpen()) {
    return c.json({ error: "signup is closed on this instance" }, 403);
  }

  const { email, password, name } = c.req.valid("json");
  const normalizedEmail = email.toLowerCase().trim();

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);
  if (existing.length > 0) {
    return c.json({ error: "email already registered" }, 409);
  }

  const passwordHash = await hashPassword(password);

  const [user] = await db
    .insert(users)
    .values({ email: normalizedEmail, passwordHash, name })
    .returning();
  if (!user) return c.json({ error: "signup failed" }, 500);

  // Provision a fresh workspace and make this user its owner.
  const [workspace] = await db
    .insert(workspaces)
    .values({ name: name ?? normalizedEmail.split("@")[0] ?? "Workspace" })
    .returning();
  if (!workspace) return c.json({ error: "signup failed" }, 500);

  await db.insert(workspaceMembers).values({
    workspaceId: workspace.id,
    userId: user.id,
    role: "owner",
  });

  // Email verification token (used either for click-to-verify or just
  // logged for self-host dev where SMTP isn't configured).
  const token = generateToken();
  await db.insert(emailTokens).values({
    token,
    userId: user.id,
    purpose: "verify_email",
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });
  await sendVerificationEmail({ to: normalizedEmail, token });

  // Log the user in immediately so they don't sit on a "check your email"
  // page with no way to use the product. Verification gates email-bound
  // features later (password reset, etc.) but not access.
  const sessionId = await createSession(user.id);
  setSessionCookie(c, sessionId);

  return c.json({
    user: { id: user.id, email: user.email, name: user.name },
    workspace: { id: workspace.id, name: workspace.name },
  });
});

const LoginBody = z.object({
  email: z.string().email().max(120),
  password: z.string().min(1).max(120),
});

authRouter.post("/login", zValidator("json", LoginBody), async (c) => {
  const { email, password } = c.req.valid("json");
  const normalizedEmail = email.toLowerCase().trim();

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  // Constant-ish failure path — same response whether the email exists or
  // the password is wrong, so we don't leak which.
  if (!user || !user.passwordHash) {
    return c.json({ error: "invalid email or password" }, 401);
  }
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    return c.json({ error: "invalid email or password" }, 401);
  }

  const sessionId = await createSession(user.id);
  setSessionCookie(c, sessionId);

  return c.json({
    user: { id: user.id, email: user.email, name: user.name },
  });
});

authRouter.post("/logout", async (c) => {
  const cookie = c.req.header("cookie");
  if (cookie) {
    const match = cookie.match(/helia_session=([^;]+)/);
    if (match?.[1]) await destroySession(match[1]);
  }
  clearSessionCookie(c);
  return c.json({ ok: true });
});

const DeleteBody = z.object({
  password: z.string().min(1).max(120),
});

/**
 * DELETE /v1/auth/me
 *
 * Permanently deletes the current user and every workspace they own.
 * Cascades take care of sessions, members, sources, chunks, tools and
 * traces.
 *
 * Memberships in other people's workspaces are also dropped (cascade on
 * `workspace_members.user_id`), but those workspaces themselves stay.
 */
authRouter.delete("/me", zValidator("json", DeleteBody), async (c) => {
  const user = currentUser(c);
  if (!user || !user.passwordHash) {
    return c.json({ error: "unauthorized" }, 401);
  }

  const { password } = c.req.valid("json");
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return c.json({ error: "invalid password" }, 401);

  // Workspaces where this user is the owner. Each one is wiped entirely
  // (sources, chunks, tools, traces) via FK cascade.
  const ownedRows = await db
    .select({ workspaceId: workspaceMembers.workspaceId })
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.userId, user.id),
        eq(workspaceMembers.role, "owner"),
      ),
    );

  for (const row of ownedRows) {
    await db.delete(workspaces).where(eq(workspaces.id, row.workspaceId));
  }

  // Drops the user + cascades sessions, email tokens, remaining memberships.
  await db.delete(users).where(eq(users.id, user.id));

  clearSessionCookie(c);
  log.info({ userId: user.id }, "account deleted");
  return c.json({ ok: true });
});

authRouter.get("/me", async (c) => {
  const user = currentUser(c);
  if (!user) return c.json({ user: null }, 200);
  return c.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      emailVerifiedAt: user.emailVerifiedAt,
    },
  });
});

/**
 * POST /v1/auth/resend-verification
 *
 * Issues a fresh verification token for the current user and sends the
 * email. Invalidates any prior unused tokens so only the latest link
 * works. No-ops if the user is already verified.
 */
authRouter.post("/resend-verification", async (c) => {
  const user = currentUser(c);
  if (!user) return c.json({ error: "unauthorized" }, 401);
  if (user.emailVerifiedAt) {
    return c.json({ ok: true, alreadyVerified: true });
  }

  await db
    .update(emailTokens)
    .set({ usedAt: new Date() })
    .where(
      and(
        eq(emailTokens.userId, user.id),
        eq(emailTokens.purpose, "verify_email"),
        isNull(emailTokens.usedAt),
      ),
    );

  const token = generateToken();
  await db.insert(emailTokens).values({
    token,
    userId: user.id,
    purpose: "verify_email",
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });
  await sendVerificationEmail({ to: user.email, token });

  return c.json({ ok: true });
});

const VerifyBody = z.object({ token: z.string().min(8).max(200) });

authRouter.post("/verify", zValidator("json", VerifyBody), async (c) => {
  const { token } = c.req.valid("json");
  const [row] = await db
    .select()
    .from(emailTokens)
    .where(
      and(
        eq(emailTokens.token, token),
        eq(emailTokens.purpose, "verify_email"),
        isNull(emailTokens.usedAt),
      ),
    )
    .limit(1);

  if (!row || row.expiresAt < new Date()) {
    return c.json({ error: "invalid or expired token" }, 400);
  }

  await db
    .update(emailTokens)
    .set({ usedAt: new Date() })
    .where(eq(emailTokens.token, token));

  await db
    .update(users)
    .set({ emailVerifiedAt: new Date() })
    .where(eq(users.id, row.userId));

  log.info({ userId: row.userId }, "email verified");
  return c.json({ ok: true });
});
