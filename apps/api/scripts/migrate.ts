import "@helia/config";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const client = postgres(url, { max: 1 });

// Extensions are infrastructure prerequisites, not schema. They must
// exist before any migration references their types (e.g. vector).
await client.unsafe(`
  CREATE EXTENSION IF NOT EXISTS vector;
  CREATE EXTENSION IF NOT EXISTS pg_trgm;
`);

await migrate(drizzle(client), { migrationsFolder: "./drizzle" });
await client.end();
console.log("✓ migrations applied");
