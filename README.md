# Helia

> Open-source AI assistant for small businesses. Upload your docs, plug in
> your APIs, drop one script tag.

![Helia home](docs/images/home.png)
![Helia upload](docs/images/upload.png)
![Helia chat](docs/images/chat.png)

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

Three things come up:

- **Admin UI** http://localhost:3000
- **API** http://localhost:4000
- **Widget dev server** http://localhost:5173/test.html

### Admin pages

- `/` — sources list, getting-started checklist
- `/upload` — add a PDF, paste text, or crawl a website
- `/sources/[id]` — per-source ingest timeline
- `/tools` — HTTP endpoints the agent can call mid-conversation
- `/widget` — brand the widget, see it live, copy the install snippet

### Make targets

```
make setup       # docker + env + install + db schema + bootstrap
make dev         # api + web + widget dev server, in parallel
make dev-api     # API only
make dev-web     # admin UI only
make dev-widget  # widget bundle + static server only (port 5173)
make down        # stop Postgres (keeps data)
make clean       # wipe build artifacts + Postgres volume
make reset       # clean + setup from scratch
make help        # list all targets
```

### Env

Only `apps/api/.env` matters. `make setup` creates it from `apps/api/.env.example`. The only value you must fill is `OPENAI_API_KEY`. `HELIA_CORS_ORIGIN` is auto-permissive on localhost in dev — set it for production.

## Architecture

```
apps/
├── api/      # Hono REST + SSE chat (port 4000)
└── web/      # Next.js admin UI, thin client of the API (port 3000)
packages/
├── agent/    # generic agent loop (persona + tools + maxSteps), AI SDK based
├── db/       # Drizzle schema + Postgres client
├── rag/      # extract / chunk / embed / retrieve / prompt / crawl / ingest
└── widget/   # vanilla TS embed bundle served on a CDN (dist/w.js)
```

`apps/api` plugs the agent in `src/agent/tools.ts`. The built-in
`search_knowledge` tool binds `@helia/rag` retrieval to the workspace. On
top of that, any HTTP tools the workspace owner registered (via the
`/tools` admin page) are loaded at chat time. The generic loop in
`@helia/agent` stays app-agnostic.

`packages/widget` is the embeddable widget. It builds to a single
`dist/w.js` IIFE bundle (~20 KB minified) that customers drop on their
site via one `<script>` tag. The widget fetches its workspace config from
`/v1/widget/config` and streams from `/v1/chat`.

For the full picture (RAG pipeline, agent loop, schema, design choices)
read [`ARCHITECTURE.md`](./ARCHITECTURE.md).

Stack: Next.js 15 · TypeScript · pnpm workspaces · Hono · Postgres + pgvector · Drizzle · Vercel AI SDK · OpenAI · shadcn/ui · hugeicons.

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
| `POST` | `/v1/chat` | AI SDK data stream (text + tool calls) |
| `GET` | `/v1/widget/config?ws=…` | Public widget config (brand, persona, theme) |
| `GET` | `/v1/workspace` | Current workspace |
| `PATCH` | `/v1/workspace` | Update brand, persona, layout |
| `GET` | `/v1/tools` | List workspace HTTP tools |
| `POST` | `/v1/tools` | Create an HTTP tool |
| `PATCH` | `/v1/tools/:id` | Update an HTTP tool |
| `DELETE` | `/v1/tools/:id` | Delete an HTTP tool |

## Widget

The customer's install snippet:

```html
<script src="https://helia.snowztech.com/w.js" data-workspace="ws_xxx" async></script>
```

In dev, point it at your local bundle and API:

```html
<script
  src="http://localhost:5173/dist/w.js"
  data-workspace="<your-workspace-uuid>"
  data-api-url="http://localhost:4000"
  async
></script>
```

The bundle reads brand + persona from `/v1/widget/config` on mount and
streams chat from `/v1/chat`. It renders inside a shadow DOM so host page
styles cannot leak in or out.

## Contributing

Fork, branch off `main`, run `make setup` + `make dev`, open a PR.
`make typecheck` should pass.

## License

AGPL-3.0.
