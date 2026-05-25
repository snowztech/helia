import { makeDb } from "@helia/db";
import pino from "pino";

/**
 * Process-wide singletons. Hono handlers import these directly instead of
 * passing them around.
 */
export const db = makeDb();

export const log = pino({
  name: "helia-api",
  transport:
    process.env.NODE_ENV === "production"
      ? undefined
      : { target: "pino-pretty", options: { colorize: true } },
});

const rawCors = process.env.HELIA_CORS_ORIGIN?.trim();

/**
 * CORS policy resolved from HELIA_CORS_ORIGIN.
 *
 *   unset / empty   → "dev-localhost": allow any http(s)://localhost:* or
 *                     127.0.0.1:* origin. Convenient for local dev when the
 *                     widget runs on a different port than the admin.
 *   "*"             → wildcard, any origin (do not use in production).
 *   "a,b,c" or "x"  → comma-separated allowlist of exact origins.
 */
export type CorsPolicy =
  | { kind: "wildcard" }
  | { kind: "list"; origins: string[] }
  | { kind: "dev-localhost" };

export const CORS_POLICY: CorsPolicy =
  !rawCors
    ? { kind: "dev-localhost" }
    : rawCors === "*"
      ? { kind: "wildcard" }
      : {
          kind: "list",
          origins: rawCors
            .split(",")
            .map((o) => o.trim())
            .filter(Boolean),
        };

/**
 * Deployment mode. Hosted (gethelia.dev) hides operator UI (provider, model,
 * token quota editor) from customer-facing settings. Self-hosters see and
 * control everything since they ARE the operator.
 */
export type HeliaMode = "hosted" | "self_host";
export const HELIA_MODE: HeliaMode =
  process.env.HELIA_MODE === "hosted" ? "hosted" : "self_host";
