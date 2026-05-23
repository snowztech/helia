#!/bin/sh
# Container entrypoint. Waits for Postgres, applies pending migrations,
# bootstraps extensions + default workspace, then starts the API.
#
# Boot order matters:
#  1. postgres-init.sql (docker-entrypoint-initdb.d, first init only) enables
#     pgvector + pg_trgm so the initial migration's vector(1536) column is
#     valid.
#  2. drizzle-kit migrate applies any pending SQL migrations from
#     apps/api/drizzle/. Tracked in the `__drizzle_migrations` table.
#  3. db:init script handles things drizzle can't express:
#       - tsvector generated column on chunks (idempotent ALTER)
#       - default workspace insert (idempotent)
#  4. API starts.
set -e

echo "→ waiting for postgres ..."
ATTEMPTS=0
until pnpm exec drizzle-kit check >/dev/null 2>&1 || [ "$ATTEMPTS" -ge 30 ]; do
  ATTEMPTS=$((ATTEMPTS + 1))
  sleep 1
done

echo "→ applying migrations (drizzle migrate) ..."
pnpm db:migrate

echo "→ bootstrapping extensions + default workspace ..."
pnpm db:init

echo "→ starting helia-api ..."
exec pnpm exec tsx src/main.ts
