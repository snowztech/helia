import "@helia/config"; // loads .env
import postgres from "postgres";

/**
 * Database bootstrap.
 *  - Enables pgvector + pg_trgm extensions.
 *  - Swaps the placeholder `chunks.tsv` text column for a generated tsvector
 *    column (Drizzle doesn't model GENERATED tsvector).
 *
 * Workspaces are created via the signup flow, not seeded here.
 *
 * Run: pnpm db:init
 */
async function main() {
  const url =
    process.env.DATABASE_URL ?? "postgresql://helia:helia@localhost:5432/helia";
  const sql = postgres(url, { prepare: false });

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

  console.log("✓ done");
  await sql.end();
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
