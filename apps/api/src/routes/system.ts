import { Hono } from "hono";
import { CORS_POLICY } from "../lib/state";
import { currentWorkspace } from "../lib/auth";
import rootPkg from "../../../../package.json";

export const systemRouter = new Hono();

/**
 * GET /v1/system
 *
 * Read-only system info for the admin Settings page. Never returns secrets,
 * only their presence and which provider is in use.
 */
systemRouter.get("/", async (c) => {
  const ws = currentWorkspace(c);
  const provider = "openai" as const;
  const keyConfigured = (process.env.OPENAI_API_KEY ?? "").length > 0;

  let allowedOrigins: string[] | "wildcard" | "dev-localhost";
  if (CORS_POLICY.kind === "wildcard") allowedOrigins = "wildcard";
  else if (CORS_POLICY.kind === "dev-localhost")
    allowedOrigins = "dev-localhost";
  else allowedOrigins = CORS_POLICY.origins;

  return c.json({
    version: rootPkg.version,
    provider,
    model: ws.model,
    keyConfigured,
    allowedOrigins,
    nodeEnv: process.env.NODE_ENV ?? "development",
  });
});
