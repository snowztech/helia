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

export const CORS_ORIGIN =
  process.env.HELIA_CORS_ORIGIN ?? "http://localhost:3000";
