import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Build a Drizzle client. The connection string is read from the caller's env.
 * Callers (apps/web, apps/worker) should pass process.env.DATABASE_URL or rely
 * on the default for local dev.
 *
 * postgres-js handles its own connection pool — no need to wrap.
 */
export function makeDb(connectionString?: string) {
  const url =
    connectionString ??
    process.env.DATABASE_URL ??
    "postgresql://helia:helia@localhost:5432/helia";
  const client = postgres(url, { prepare: false });
  return drizzle(client, { schema });
}

export type Db = ReturnType<typeof makeDb>;
