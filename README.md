# Helia

> Open-source AI support agent. Upload your docs, get a chatbot.

## Quick start

Prerequisites: **Node 22+**, **pnpm 9+**, **Docker**, an **OpenAI API key**.

```bash
git clone https://github.com/snowztech/helia
cd helia
make setup
```

Open `apps/api/.env` and set `OPENAI_API_KEY` (get one at https://platform.openai.com/api-keys).

```bash
make dev
```

Open http://localhost:3000.

- `/upload` — add a PDF, paste text, or crawl a website.
- `/` — live source status with auto-refresh.
- `/sources/[id]` — per-source event timeline.
- `/chat` — ask questions, see cited sources.

API runs on http://localhost:4000.

### Make targets

```
make setup      # docker + env + install + db schema + bootstrap
make dev        # start API + Web in parallel
make dev-api    # API only
make dev-web    # Web only
make down       # stop Postgres (keeps data)
make clean      # wipe build artifacts + Postgres volume
make reset      # clean + setup from scratch
make help       # list all targets
```

### Env

Only `apps/api/.env` matters. `make setup` creates it from `apps/api/.env.example`. The only value you must fill is `OPENAI_API_KEY`.

## Architecture

```
apps/
├── api/    # Hono REST + SSE chat (port 4000)
└── web/    # Next.js UI, thin client of the API (port 3000)
packages/
├── agent/  # generic agent loop (persona + tools + maxSteps), AI SDK based
├── db/     # Drizzle schema + Postgres client
└── rag/    # extract / chunk / embed / retrieve / prompt / crawl / ingest
```

`apps/api` plugs the agent in `src/agent/tools.ts`. Those are the concrete tools that bind `@helia/rag` retrieval to the workspace. The generic loop in `@helia/agent` stays app agnostic.

For the full picture (RAG pipeline, agent loop, schema, design choices) read [`ARCHITECTURE.md`](./ARCHITECTURE.md).

Stack: Next.js 15 · TypeScript · pnpm workspaces · Hono · Postgres + pgvector · Drizzle · Vercel AI SDK · OpenAI.

## API

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/v1/health` | Liveness + DB check |
| `GET` | `/v1/sources` | List all sources |
| `GET` | `/v1/sources/:id` | Source detail |
| `GET` | `/v1/sources/:id/events` | Ingest timeline |
| `POST` | `/v1/sources/pdf` | Multipart upload, sync ingest |
| `POST` | `/v1/sources/text` | `{ name, text }`, sync ingest |
| `POST` | `/v1/sources/url` | `{ url, maxPages? }`, background crawl |
| `DELETE` | `/v1/sources/:id` | Cascade delete chunks + events |
| `POST` | `/v1/chat` | SSE stream, citations in `x-helia-sources` header |

## Contributing

Fork, branch off `main`, run `make setup` + `make dev`, open a PR. `make typecheck` should pass.

## License

AGPL-3.0.
