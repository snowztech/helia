#!/bin/sh
# Container entrypoint. Waits for Postgres, applies pending migrations,
# bootstraps extensions + default workspace, then starts the API.
#
# Env vars are injected by docker-compose (no .env file inside the image).
# Boot order:
#   1. drizzle-kit migrate — applies any pending SQL migrations
#   2. db:init             — extensions, tsvector column, default workspace
#   3. tsx src/main.ts     — start the server
set -e

echo "→ applying migrations (drizzle migrate) ..."
pnpm exec drizzle-kit migrate

echo "→ bootstrapping extensions + default workspace ..."
pnpm exec tsx scripts/db-init.ts

echo "→ starting helia-api ..."
exec pnpm exec tsx src/main.ts
