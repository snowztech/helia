import { config as loadEnv } from "dotenv";
import type { Config } from "drizzle-kit";

loadEnv({ path: ".env" });

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
