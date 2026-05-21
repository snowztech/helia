-- Run once when the Postgres container first initializes the helia DB.
-- pgvector image has the extension installed; we just enable it.
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
