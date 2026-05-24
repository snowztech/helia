#!/bin/sh
# Container entrypoint. Applies pending migrations, installs pg
# extensions + the chunks.tsv generated column, then starts the API.
set -e

echo "→ applying migrations (drizzle migrate) ..."
pnpm exec drizzle-kit migrate

echo "→ bootstrapping extensions + tsvector column ..."
pnpm exec tsx scripts/db-init.ts

echo "→ starting helia-api ..."
exec pnpm exec tsx src/main.ts
