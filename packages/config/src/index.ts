/**
 * Loads the repo-root `.env` for any process that imports this package.
 *
 * Side-effect import:
 *
 *     import "@helia/config";   // first line of your entry / config file
 *
 * Path is resolved from this file's location (packages/config/src/), so
 * the resolver is robust to CWD. In docker the file doesn't exist —
 * env comes from the compose `environment:` section — and we skip
 * silently.
 *
 * When env validation lands (typed schema, required-vs-optional, format
 * checks), it goes here. Keep imports server-side only.
 */
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";

const here = dirname(fileURLToPath(import.meta.url));
// packages/config/src/index.ts → repo root is three levels up.
const envPath = join(here, "..", "..", "..", ".env");

if (existsSync(envPath)) {
  loadEnv({ path: envPath });
}

export const env = process.env;
