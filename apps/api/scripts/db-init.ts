import { config as loadEnv } from "dotenv";
import postgres from "postgres";
import { makeDb, workspaces } from "@helia/db";

// Single source of truth for env is the repo-root `.env`. Inside docker
// the file doesn't exist (env comes from compose); dotenv silently skips.
loadEnv({ path: "../../.env" });

/**
 * Bootstrap script.
 *  - Enables pgvector + pg_trgm.
 *  - Replaces placeholder `chunks.tsv` text column with a generated tsvector.
 *  - Creates a default workspace if none exists.
 *
 * Run: pnpm db:init
 */
async function main() {
  const url =
    process.env.DATABASE_URL ?? "postgresql://helia:helia@localhost:5432/helia";
  const sql = postgres(url, { prepare: false });
  const db = makeDb(url);

  console.log("→ Enabling extensions and tsv generated column…");
  await sql.unsafe(`
    CREATE EXTENSION IF NOT EXISTS vector;
    CREATE EXTENSION IF NOT EXISTS pg_trgm;

    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'chunks' AND column_name = 'tsv' AND data_type = 'text'
      ) THEN
        ALTER TABLE chunks DROP COLUMN tsv;
        ALTER TABLE chunks
          ADD COLUMN tsv tsvector
          GENERATED ALWAYS AS (to_tsvector('simple', coalesce(content, ''))) STORED;
        CREATE INDEX IF NOT EXISTS chunks_tsv_idx ON chunks USING GIN (tsv);
      END IF;
    END $$;
  `);

  console.log("→ Ensuring default workspace…");
  const existing = await db.select().from(workspaces).limit(1);
  if (existing.length === 0) {
    const [ws] = await db
      .insert(workspaces)
      .values({ name: "Default Workspace" })
      .returning();
    console.log(`✓ Created default workspace: ${ws?.id}`);
  } else {
    console.log(`✓ Workspace exists: ${existing[0]?.id}`);
  }

  await sql.end();
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
