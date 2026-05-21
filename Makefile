.PHONY: help dev dev-api dev-web dev-widget setup db install schema init build typecheck clean down reset env

help:
	@echo "Helia — make targets"
	@echo ""
	@echo "  dev        - Setup if needed, then run api + web + widget in parallel"
	@echo "  dev-api    - Run only the API (port 4000)"
	@echo "  dev-web    - Run only the web UI (port 3000)"
	@echo "  dev-widget - Run only the widget dev server (port 5173)"
	@echo ""
	@echo "  setup      - One-shot: db + env + install + schema + bootstrap"
	@echo "  db         - Start Postgres only"
	@echo "  env        - Copy .env.example to apps/api/.env if missing"
	@echo "  install    - pnpm install"
	@echo "  schema     - Push Drizzle schema"
	@echo "  init       - Bootstrap extensions + default workspace"
	@echo ""
	@echo "  build      - Build all packages and apps"
	@echo "  typecheck  - Run typecheck across the workspace"
	@echo ""
	@echo "  down       - Stop Postgres (keeps the volume)"
	@echo "  clean      - Remove .next, node_modules, drop volumes"
	@echo "  reset      - Destructive: clean + setup from scratch"

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

schema:
	@echo "→ Pushing Drizzle schema…"
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

down:
	@echo "→ Stopping Postgres…"
	@docker compose down

clean:
	@echo "→ Cleaning build artifacts and dropping volumes…"
	@rm -rf apps/web/.next apps/web/node_modules apps/api/node_modules
	@rm -rf packages/db/node_modules packages/rag/node_modules
	@rm -rf node_modules
	@docker compose down -v

reset: clean setup
	@echo "✓ Reset complete."
