# Self-host Helia

A docker compose stack you can run on any Linux box with Docker installed.
Three containers: postgres, api, web. Persistent data in a named volume.

## Prerequisites

- Docker 24+
- An OpenAI API key (https://platform.openai.com/api-keys)

That's it. No Node or pnpm needed — everything runs inside containers.

## Quick start

```bash
git clone https://github.com/snowztech/helia
cd helia
cp .env.example .env
```

Open `.env` and set two values:

```bash
OPENAI_API_KEY=sk-...
MASTER_KEY=$(openssl rand -hex 32)
```

Then bring up the stack:

```bash
docker compose up -d
```

First boot takes ~30 seconds — the api container waits for postgres,
applies migrations, and creates the default workspace. Watch with:

```bash
docker compose logs -f api
```

When the api log says `helia-api listening on http://localhost:4000`,
open **http://localhost:3000** in your browser. You're in.

## What you get

- **Admin UI** at `http://localhost:3000`
- **API** at `http://localhost:4000`
- **Widget bundle** served at `http://localhost:3000/w.js`
- **Postgres** at `127.0.0.1:5432` (bound to localhost only)

Persistent data lives in the `helia_pgdata` Docker volume. Removing
containers does not delete it. `docker compose down -v` does.

## Configure your bot

Once the stack is up:

1. Go to `/sources` and add your docs (PDF, URL crawl, or paste text).
2. Go to `/tools` and register the HTTP endpoints the agent can call.
3. Go to `/widget` and brand it. Copy the install snippet.
4. Paste the snippet into the pages where you want the widget.

## Embed the widget on your site

The snippet shown in `/widget` looks like:

```html
<script src="http://your-helia-host/w.js" data-workspace="<uuid>" async></script>
```

The widget calls back to `NEXT_PUBLIC_API_URL` (set in `.env`) for both
its config and the chat stream. For local testing this is
`http://localhost:4000` — for production set `HELIA_PUBLIC_API_URL` to
your real host.

## Production deploy

Behind a reverse proxy (Caddy, nginx, Traefik), terminate TLS and route
both the admin UI and the API to a single hostname. Example Caddy:

```caddyfile
helia.example.com {
    handle /v1/* {
        reverse_proxy localhost:4000
    }
    handle {
        reverse_proxy localhost:3000
    }
}
```

Then in `.env`:

```bash
HELIA_PUBLIC_API_URL=https://helia.example.com
HELIA_CORS_ORIGIN=https://helia.example.com,https://app.yourdomain.com
```

Customer pages embed the snippet with the same host:

```html
<script src="https://helia.example.com/w.js" data-workspace="..." async></script>
```

## Backups

The volume `helia_pgdata` holds everything. Two options:

**Logical (recommended):**

```bash
docker compose exec postgres pg_dump -U helia helia > backup.sql
```

Restore with `docker compose exec -T postgres psql -U helia helia < backup.sql`.

**Volume snapshot:**

```bash
docker run --rm -v helia_pgdata:/data -v $(pwd):/backup alpine \
  tar czf /backup/pgdata.tar.gz -C /data .
```

## Upgrade

```bash
git pull
docker compose build api web
docker compose up -d
```

The api container applies any new migrations on boot. The widget bundle
is rebuilt and copied into the web image automatically.

## Stop / reset

```bash
docker compose down            # stop, keep data
docker compose down -v         # stop and delete the postgres volume
```

## Troubleshooting

**api stuck waiting for postgres** — check `docker compose logs postgres`
for an error. The pgvector image enables the `vector` and `pg_trgm`
extensions automatically; if you're using a custom Postgres image you
need to install them yourself.

**widget shows "API unreachable" on a customer's site** — verify
`HELIA_CORS_ORIGIN` includes their domain, and that `NEXT_PUBLIC_API_URL`
points to a host their browser can reach.

**OpenAI errors in the agent** — confirm `OPENAI_API_KEY` is set in
`.env` (not in `apps/api/.env`, which is the dev-only path). Restart
with `docker compose restart api`.

## Where to file issues

https://github.com/snowztech/helia/issues
