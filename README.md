# Helia

> Open-source AI assistant for small businesses. Upload your docs, plug in
> your APIs, drop one script tag.

![Helia home](docs/images/home.png)
![Helia upload](docs/images/upload.png)
![Helia chat](docs/images/chat.png)

## Self-host (recommended)

The fast path: docker compose. No Node or pnpm needed on the host.

```bash
git clone https://github.com/snowztech/helia
cd helia
cp .env.example .env
# fill OPENAI_API_KEY and MASTER_KEY (openssl rand -hex 32)
docker compose up -d
```

Open **http://localhost:3000**. The schema applies and the default
workspace is created on first boot. Full guide: [`SELF_HOST.md`](./SELF_HOST.md).

## Admin pages

- `/` — dashboard: messages this week, today, avg response, recent activity, getting-started checklist
- `/sources` — list + add (PDF / text / URL crawl)
- `/sources/[id]` — per-source ingest timeline
- `/tools` — HTTP endpoints the agent can call mid-conversation
- `/widget` — brand the widget, live preview, copy the install snippet
- `/settings` — workspace name, locale, model, API key status, allowed origins
- Settings gear icon top-right of every page

## Widget

Snippet (paste into any page on your site, before `</body>`):

```html
<script src="https://your-helia-host/w.js" data-workspace="<uuid>" async></script>
```

The widget reads brand + persona from `/v1/widget/config` on mount, streams
chat from `/v1/chat`, and renders inside a shadow DOM so host page styles
cannot leak in or out.

Local dev points it at the widget dev server instead:

```html
<script
  src="http://localhost:5173/dist/w.js"
  data-workspace="<your-workspace-uuid>"
  data-api-url="http://localhost:4000"
  async
></script>
```

## API

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/v1/health` | Liveness + DB check |
| `GET` | `/v1/system` | Read-only system info (model, key status, version) |
| `GET` | `/v1/workspace` | Current workspace |
| `PATCH` | `/v1/workspace` | Update name, locale, model, brand, layout |
| `GET` | `/v1/widget/config?ws=…` | Public widget config |
| `POST` | `/v1/chat` | AI SDK data stream (text + tool calls) |
| `GET` | `/v1/metrics` | Counts (today, week, total) + avg latency + tokens |
| `GET` | `/v1/conversations` | Recent chat traces |
| `GET` | `/v1/sources` | List all sources |
| `GET` | `/v1/sources/:id` | Source detail |
| `GET` | `/v1/sources/:id/events` | Ingest timeline |
| `POST` | `/v1/sources/pdf` | Multipart upload, sync ingest |
| `POST` | `/v1/sources/text` | `{ name, text }`, sync ingest |
| `POST` | `/v1/sources/url` | `{ url, maxPages? }`, background crawl |
| `DELETE` | `/v1/sources/:id` | Cascade delete chunks + events |
| `GET` | `/v1/tools` | List workspace HTTP tools |
| `POST` | `/v1/tools` | Create an HTTP tool |
| `PATCH` | `/v1/tools/:id` | Update an HTTP tool |
| `DELETE` | `/v1/tools/:id` | Delete an HTTP tool |

## Architecture

```
apps/
├── api/      # Hono REST + SSE chat (port 4000)
└── web/      # Next.js admin UI (port 3000)
packages/
├── agent/    # generic agent loop (persona + tools + maxSteps), AI SDK based
├── db/       # Drizzle schema + Postgres client
├── rag/      # extract / chunk / embed / retrieve / prompt / crawl / ingest
└── widget/   # vanilla TS embed bundle (~20 KB minified)
```

`apps/api` plugs the agent in `src/agent/tools.ts`. The built-in
`search_knowledge` tool binds `@helia/rag` retrieval to the workspace. On
top of that, any HTTP tools the workspace owner registered (via the
`/tools` admin page) are loaded at chat time. The generic loop in
`@helia/agent` stays app-agnostic.

Full design choices in [`ARCHITECTURE.md`](./ARCHITECTURE.md). The
current sprint plan to v1 in [`V1.md`](./V1.md). Long-arc roadmap in
[`ROADMAP.md`](./ROADMAP.md).

**Stack** — Next.js 15 · TypeScript · pnpm workspaces · Hono · Postgres +
pgvector · Drizzle · Vercel AI SDK · OpenAI · shadcn/ui · hugeicons.

## Develop

Local dev runs Node directly. Prerequisites: **Node 22+**, **pnpm 9+**,
**Docker** (for postgres only), an **OpenAI API key**.

```bash
make setup    # docker postgres + env + install + schema + bootstrap
make dev      # api (4000) + admin (3000) + widget dev server (5173) in parallel
```

Helpful targets — full list with `make help`:

```
make dev          api + web + widget in parallel
make dev-api      API only
make dev-web      admin only
make dev-widget   widget dev server only
make schema      apply Drizzle migrations
make typecheck   strict TS across the workspace
make docker-up   build + start the self-host stack
make docker-logs tail logs from all containers
```

## Contributing

Fork, branch off `main`, `make setup` + `make dev`, open a PR.
`make typecheck` must pass. See [`CONTRIBUTING.md`](./CONTRIBUTING.md).

## License

AGPL-3.0.
