import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { and, eq, gt } from "drizzle-orm";
import type { Context, MiddlewareHandler } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import {
  sessions,
  users,
  workspaceMembers,
  workspaces,
  type User,
  type Workspace,
} from "@helia/db";
import { db, log } from "./state";

const COOKIE_NAME = "helia_session";
const SESSION_DAYS = 30;
const BCRYPT_ROUNDS = 10;

export const signupOpen = (): boolean =>
  (process.env.HELIA_SIGNUP ?? "open").toLowerCase() === "open";

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function generateToken(length = 32): string {
  return randomBytes(length).toString("hex");
}

function sessionExpiry(): Date {
  return new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
}

export async function createSession(userId: string): Promise<string> {
  const id = generateToken();
  await db.insert(sessions).values({
    id,
    userId,
    expiresAt: sessionExpiry(),
  });
  return id;
}

export async function destroySession(id: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.id, id));
}

export function setSessionCookie(c: Context, id: string): void {
  setCookie(c, COOKIE_NAME, id, {
    httpOnly: true,
    sameSite: "Lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export function clearSessionCookie(c: Context): void {
  deleteCookie(c, COOKIE_NAME, { path: "/" });
}

interface AuthContext {
  user: User;
  workspace: Workspace;
}

/**
 * Resolve current user + workspace from the session cookie. Returns null
 * if no valid session.
 */
async function resolveAuth(c: Context): Promise<AuthContext | null> {
  const cookie = getCookie(c, COOKIE_NAME);
  if (!cookie) return null;

  const [row] = await db
    .select({
      user: users,
      workspace: workspaces,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .innerJoin(workspaceMembers, eq(workspaceMembers.userId, users.id))
    .innerJoin(workspaces, eq(workspaces.id, workspaceMembers.workspaceId))
    .where(and(eq(sessions.id, cookie), gt(sessions.expiresAt, new Date())))
    .limit(1);

  if (!row) return null;
  return { user: row.user, workspace: row.workspace };
}

/**
 * Gate non-public routes. Public paths (chat widget, login/signup) pass
 * through with whatever auth context we could resolve — possibly none.
 * Everything else demands a valid session.
 */
const PUBLIC_PATHS = new Set([
  "/v1/health",
  "/v1/widget/config",
  "/v1/chat",
  "/v1/auth/signup",
  "/v1/auth/login",
  "/v1/auth/verify",
  "/v1/auth/me",
]);

export const authMiddleware: MiddlewareHandler = async (c, next) => {
  const path = new URL(c.req.url).pathname;
  const auth = await resolveAuth(c);

  if (auth) {
    c.set("user", auth.user);
    c.set("workspace", auth.workspace);
  } else {
    c.set("user", null);
    c.set("workspace", null);
  }

  if (PUBLIC_PATHS.has(path)) return next();

  if (!auth) {
    return c.json({ error: "unauthorized" }, 401);
  }

  return next();
};

/**
 * Helpers for routes — typed access to the context the middleware filled.
 */
export function currentUser(c: Context): User | null {
  return c.get("user") ?? null;
}

export function currentWorkspace(c: Context): Workspace {
  const ws = c.get("workspace");
  if (!ws) {
    log.error("currentWorkspace called without auth context");
    throw new Error("no workspace in context");
  }
  return ws;
}

