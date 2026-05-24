import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { workspaces } from "@helia/db";
import { eq } from "drizzle-orm";
import { db } from "../lib/state";
import { currentWorkspace } from "../lib/auth";
import { encrypt } from "../lib/crypto";
import { generateIdentitySecret } from "../lib/hmac";

export const workspaceRouter = new Hono();

/**
 * GET /v1/workspace
 *
 * Returns the workspace tied to the current session.
 */
workspaceRouter.get("/", async (c) => {
  const ws = currentWorkspace(c);
  return c.json({ workspace: redact(ws) });
});

const PatchBody = z.object({
  name: z.string().min(1).max(80).optional(),
  locale: z.string().min(2).max(8).optional(),
  model: z.string().min(1).max(60).optional(),
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
  botAvatar: z.string().max(500).nullable().optional(),
  botSuggestions: z.array(z.string().min(1).max(120)).max(6).optional(),
  identityRequired: z.boolean().optional(),
  tokenQuotaMonthly: z.number().int().min(10_000).max(100_000_000).optional(),
});

/**
 * PATCH /v1/workspace
 *
 * Updates branding and persona on the current workspace.
 */
workspaceRouter.patch("/", zValidator("json", PatchBody), async (c) => {
  const patch = c.req.valid("json");
  const current = currentWorkspace(c);

  // Refuse to flip identityRequired on if no secret exists. We let it flip
  // off freely (so a stuck customer can recover by disabling and rotating).
  if (patch.identityRequired === true && !current.identitySecret) {
    return c.json(
      { error: "generate an identity secret before requiring it" },
      400,
    );
  }

  const [updated] = await db
    .update(workspaces)
    .set(patch)
    .where(eq(workspaces.id, current.id))
    .returning();

  return c.json({ workspace: redact(updated) });
});

/**
 * POST /v1/workspace/identity-secret/rotate
 *
 * Generates a fresh signing secret, encrypts it at rest, and returns the
 * plaintext exactly once. Anything signed by the previous secret stops
 * verifying immediately.
 */
workspaceRouter.post("/identity-secret/rotate", async (c) => {
  const current = currentWorkspace(c);
  const plaintext = generateIdentitySecret();
  const ciphertext = encrypt(plaintext);

  await db
    .update(workspaces)
    .set({ identitySecret: ciphertext })
    .where(eq(workspaces.id, current.id));

  return c.json({ secret: plaintext });
});

/**
 * Strip server-side ciphertext fields before responding. The settings UI
 * needs to know whether a secret EXISTS, not the encrypted blob.
 */
function redact<T extends { identitySecret?: string | null }>(
  ws: T | undefined,
): (Omit<T, "identitySecret"> & { identityConfigured: boolean }) | undefined {
  if (!ws) return undefined;
  const { identitySecret, ...rest } = ws;
  return { ...rest, identityConfigured: Boolean(identitySecret) };
}
