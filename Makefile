.PHONY: help dev dev-api dev-web dev-widget setup db install schema schema-push init build typecheck clean down reset env docker-up docker-build docker-down docker-logs docker-reset

help:
	@echo "Helia — make targets"
	@echo ""
	@echo "  Development (local node + postgres)"
	@echo "    dev          Setup if needed, then run api + web + widget in parallel"
	@echo "    dev-api      Run only the API (port 4000)"
	@echo "    dev-web      Run only the web UI (port 3000)"
	@echo "    dev-widget   Run only the widget dev server (port 5173)"
	@echo ""
	@echo "  Setup"
	@echo "    setup        One-shot: db + env + install + schema + bootstrap"
	@echo "    db           Start Postgres only"
	@echo "    env          Copy apps/api/.env.example if missing"
	@echo "    install      pnpm install"
	@echo "    schema       Apply pending Drizzle migrations (production-safe)"
	@echo "    schema-push  Sync schema to DB without migrations (dev only)"
	@echo "    init         Bootstrap extensions + default workspace"
	@echo ""
	@echo "  Quality"
	@echo "    build        Build all packages and apps"
	@echo "    typecheck    Run typecheck across the workspace"
	@echo ""
	@echo "  Self-host (docker compose)"
	@echo "    docker-up    Build and start the full stack (postgres + api + web)"
	@echo "    docker-build Build the api and web images"
	@echo "    docker-down  Stop the stack (keep data)"
	@echo "    docker-logs  Tail logs for all services"
	@echo "    docker-reset Stop, drop volumes, and rebuild from scratch"
	@echo ""
	@echo "  Cleanup"
	@echo "    down         Stop Postgres (keeps the volume)"
	@echo "    clean        Remove .next, node_modules, drop volumes"
	@echo "    reset        Destructive: clean + setup from scratch"

# ─── local development ──────────────────────────────────────────────────

db:
	@echo "→ Starting Postgres + pgvector…"
	@docker compose up -d postgres
	@echo "→ Waiting for Postgres to accept connections…"
	@until docker compose exec -T postgres pg_isready -U helia >/dev/null 2>&1; do sleep 1; done
	@echo "✓ Postgres ready"

env:
	@if [ ! -f apps/api/.env ]; then \
		cp apps/api/.env.example apps/api/.env; \
		echo "✓ Created apps/api/.env from apps/api/.env.example"; \
		echo "  → Edit apps/api/.env: set OPENAI_API_KEY (get one at https://platform.openai.com/api-keys)"; \
	else \
		echo "✓ apps/api/.env already exists"; \
	fi
	@if grep -qE '^OPENAI_API_KEY=\s*$$' apps/api/.env 2>/dev/null; then \
		echo ""; \
		echo "⚠  OPENAI_API_KEY is empty in apps/api/.env — chat and ingestion will fail."; \
		echo "   Fill it in before running 'make dev'."; \
	fi

install:
	@echo "→ pnpm install…"
	@pnpm install

# Production-safe: applies migration files from apps/api/drizzle/. The same
# command runs in the api container on every boot.
schema:
	@echo "→ Applying Drizzle migrations…"
	@pnpm db:migrate

# Dev-only fast path: syncs schema.ts straight to the DB without writing a
# migration file. Use during schema iteration, then `pnpm db:generate` to
# commit the migration before pushing the branch.
schema-push:
	@echo "→ Pushing Drizzle schema (dev only)…"
	@pnpm db:push

init:
	@echo "→ Bootstrapping extensions and default workspace…"
	@pnpm db:init

setup: db env install schema init
	@echo ""
	@echo "✓ Helia is ready."
	@echo "  Next: make dev"

dev: setup
	@echo "→ Starting api (:4000) + web (:3000) + widget (:5173)…"
	@pnpm dev

dev-api:
	@pnpm dev:api

dev-web:
	@pnpm dev:web

dev-widget:
	@pnpm dev:widget

build:
	@pnpm -r build

typecheck:
	@pnpm -r typecheck

# ─── self-host (docker compose) ─────────────────────────────────────────

docker-up:
	@if [ ! -f .env ]; then \
		echo "✗ .env missing — run: cp .env.example .env, then fill OPENAI_API_KEY + MASTER_KEY"; \
		exit 1; \
	fi
	@echo "→ Building and starting Helia stack…"
	@docker compose up -d --build
	@echo ""
	@echo "✓ Stack up:"
	@echo "    admin   http://localhost:3000"
	@echo "    api     http://localhost:4000"
	@echo "    widget  http://localhost:3000/w.js"
	@echo ""
	@echo "  Tail logs: make docker-logs"

docker-build:
	@docker compose build api web

docker-down:
	@docker compose down

docker-logs:
	@docker compose logs -f

docker-reset:
	@echo "⚠  Destructive: dropping volume and rebuilding from scratch."
	@docker compose down -v
	@docker compose up -d --build

# ─── cleanup ────────────────────────────────────────────────────────────

down:
	@echo "→ Stopping Postgres…"
	@docker compose down

clean:
	@echo "→ Cleaning build artifacts and dropping volumes…"
	@rm -rf apps/web/.next apps/web/node_modules apps/web/public/w.js apps/web/public/w.js.map
	@rm -rf apps/api/node_modules
	@rm -rf packages/db/node_modules packages/rag/node_modules packages/agent/node_modules packages/widget/node_modules packages/widget/dist
	@rm -rf node_modules
	@docker compose down -v

reset: clean setup
	@echo "✓ Reset complete."
