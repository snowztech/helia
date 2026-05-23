import { config as loadEnv } from "dotenv";
import type { Config } from "drizzle-kit";

// Single source of truth for env is the repo-root `.env`. Inside docker
// the file doesn't exist (env comes from compose); dotenv silently skips.
loadEnv({ path: "../../.env" });

export default {
  // Schema lives in the shared @helia/db package.
  schema: "../../packages/db/src/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgresql://helia:helia@localhost:5432/helia",
  },
  strict: true,
  verbose: true,
} satisfies Config;
