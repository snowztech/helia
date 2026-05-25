# Deploy Helia

Three paths, increasing in complexity. Pick the one that matches the
operations effort you want to spend.

| Path | Cost / mo | Ops effort | When to pick |
|---|---|---|---|
| [Docker compose](#docker-compose-fastest) | $5–10 | Manual | Local, demos, dogfooding on a small VPS |
| [Hetzner + Caddy](#hetzner--caddy-production-vps) | ~€4 | You own the box | Confident running a VPS, want the cheapest production bill |
| [Railway + Neon](#railway--neon-managed) | ~$15–30 | Almost zero | Don't want to touch servers |

All three reach the same end state: one Next.js admin UI + one Hono API
+ one Postgres. Customers embed `<script src=".../w.js">` on their site.

## Pre-flight

You need:

- A domain (skip for local). Examples below use `gethelia.dev`.
- An OpenAI API key.
- A 32-byte master key: `openssl rand -hex 32`.
- (Optional) A Resend API key for verification emails. Without it,
  links are printed to the api logs (fine while iterating).

The repo is deploy-ready:

- `apps/api/Dockerfile` + `apps/web/Dockerfile` build production images.
- `apps/api/scripts/migrate.ts` enables Postgres extensions and applies
  pending migrations. Run it as a pre-deploy step (Railway, Fly), or
  before the api container starts (compose).
- `apps/web/next.config.ts` outputs a standalone Next.js bundle.
- `.env.example` documents every variable.

You should not need to edit Dockerfiles or build scripts.

---

## Docker compose (fastest)

Three containers: postgres, api, web. Persistent data in a named volume.
Same setup works on your laptop or a small VPS.

```bash
git clone https://github.com/snowztech/helia
cd helia
cp .env.example .env
```

Set the two required values in `.env`:

```bash
OPENAI_API_KEY=sk-...
MASTER_KEY=$(openssl rand -hex 32)
```

Bring it up:

```bash
docker compose up -d
docker compose logs -f api    # wait for "helia-api listening"
```

Open `http://localhost:3000` and sign up. The api container waits for
postgres, applies migrations, and is ready in about 30 seconds.

What you get:

- Admin UI at `http://localhost:3000`
- API at `http://localhost:4000`
- Widget bundle at `http://localhost:3000/w.js`
- Postgres at `127.0.0.1:5432` (bound to localhost only)

Persistent data lives in the `helia_pgdata` Docker volume. Removing
containers does not delete it. `docker compose down -v` does.

### Upgrade

```bash
git pull
docker compose build api web
docker compose up -d
```

Migrations run automatically on api boot. The widget bundle is rebuilt
and copied into the web image automatically.

### Stop / reset

```bash
docker compose down            # stop, keep data
docker compose down -v         # stop and delete the postgres volume
```

---

## Hetzner + Caddy (production VPS)

Cheapest production path. One box, one Caddyfile, one docker compose.

### 1. Provision

- Hetzner CX22 (€4/mo, 2 vCPU, 4 GB) is enough. DigitalOcean / Linode
  equivalents work the same.
- SSH in, install Docker and Caddy:

  ```bash
  apt update && apt install -y docker.io docker-compose-plugin caddy
  ```

### 2. Clone + configure

Same as compose above (`git clone` → `cp .env.example .env`), then fill
in production values:

```bash
OPENAI_API_KEY=sk-...
MASTER_KEY=<openssl rand -hex 32>
HELIA_WEB_URL=https://app.gethelia.dev
HELIA_API_URL=https://app.gethelia.dev
HELIA_CORS_ORIGIN=https://app.gethelia.dev,https://gethelia.dev
HELIA_SIGNUP=open
RESEND_API_KEY=re_...                  # optional
HELIA_EMAIL_FROM=Helia <no-reply@gethelia.dev>
```

### 3. Caddyfile

`/etc/caddy/Caddyfile`:

```caddy
app.gethelia.dev {
    handle /v1/* {
        reverse_proxy localhost:4000
    }
    handle {
        reverse_proxy localhost:3000
    }
}
```

Reload: `systemctl reload caddy`. TLS issues automatically via Let's
Encrypt.

### 4. DNS + boot

- DNS A record: `app.gethelia.dev` → server IP.
- `docker compose up -d` from the repo root.
- `https://app.gethelia.dev` → signup page.

This path uses **one subdomain**. The Caddy `handle /v1/*` block routes
API traffic to the api container; everything else goes to web.
`HELIA_COOKIE_DOMAIN` is **not needed** here (session cookie lives on
the same host as the admin UI).

---

## Railway + Neon (managed)

Two Railway services + external Postgres. No server admin.

### 1. Neon

- Create a project at [neon.tech](https://neon.tech). Region matches
  Railway's region (US-East for Railway `us-east`).
- Connection Details → copy the **pooled connection string** (the one
  with `-pooler` in the hostname). Use this as `DATABASE_URL`.
- Extensions (`pgvector`, `pg_trgm`) install automatically via the
  pre-deploy `scripts/migrate.ts` step. Don't enable them manually.

### 2. Railway: api service

- New project → Deploy from GitHub → pick your fork.
- Service settings:
  - **Root directory**: `apps/api`
  - **Builder**: Dockerfile (Railway auto-detects)
  - **Watch paths**: `/apps/api/**`, `/packages/**`, `/pnpm-lock.yaml`,
    `/package.json` (covers monorepo lockfile changes too)
  - **Pre-deploy command**: `pnpm exec tsx scripts/migrate.ts`
  - **Healthcheck path**: `/v1/health` (prevents a broken deploy from
    going live)
  - **Memory limit**: 512 MB to start
- Environment:

  ```
  DATABASE_URL=<pooled Neon URL>
  OPENAI_API_KEY=sk-...
  MASTER_KEY=<openssl rand -hex 32>
  HELIA_WEB_URL=https://app.gethelia.dev
  HELIA_API_URL=https://api.gethelia.dev
  HELIA_CORS_ORIGIN=https://app.gethelia.dev,https://gethelia.dev
  HELIA_COOKIE_DOMAIN=.gethelia.dev
  HELIA_SIGNUP=open
  RESEND_API_KEY=re_...                 # optional
  HELIA_EMAIL_FROM=Helia <no-reply@gethelia.dev>
  NODE_ENV=production
  PORT=4000
  ```

  `HELIA_COOKIE_DOMAIN` matters here: api and admin live on different
  subdomains, and the leading dot lets the session cookie span both.

- Custom domain → `api.gethelia.dev`. Railway gives you a CNAME target;
  add it at your DNS host.

### 3. Railway: web service

- Same project → New service → same repo.
- Service settings:
  - **Root directory**: `apps/web`
  - **Watch paths**: `/apps/web/**`, `/packages/**`, `/pnpm-lock.yaml`,
    `/package.json`
  - **Builder**: Dockerfile
  - **Memory limit**: 512 MB
- Environment:

  ```
  HELIA_API_URL=https://api.gethelia.dev
  HELIA_INTERNAL_API_URL=https://api.gethelia.dev
  NODE_ENV=production
  PORT=3000
  ```

- Custom domain → `app.gethelia.dev`.

> **Build-time gotcha**: `HELIA_API_URL` is read by `next.config.ts`
> during the Docker build to bake `NEXT_PUBLIC_API_URL` into the browser
> bundle. If you change it, **redeploy** the web service (setting the
> env var alone doesn't update the browser bundle).

### 4. First boot smoke test

1. `https://app.gethelia.dev` → middleware sends you to `/login`.
2. Sign up → check the api service logs for the verification link.
3. Verify → logged in.
4. Upload a source in `/sources` → ingest completes.
5. Embed the widget on a test page → chat → see it in `/conversations`.

---

## After launch

### Backups

**Compose / Hetzner.** Logical dump on a cron:

```bash
docker compose exec postgres pg_dump -U helia helia > backup.sql
```

Restore: `docker compose exec -T postgres psql -U helia helia < backup.sql`.

**Neon.** 24h snapshots on free, point-in-time-restore on Scale tier.

### Monitoring

Railway, Caddy, and `docker compose logs` show request logs out of the
box. For real visibility, add structured logging + an error tracker
(Sentry) when you have real traffic.

### Scaling

You'll outgrow Neon's 3 GB free tier before you outgrow Railway's
compute. Plan to upgrade Neon ($19/mo Scale) when storage approaches
the limit.

The in-process rate limiter (`apps/api/src/lib/rate-limit.ts`) holds
counters in memory. With one api replica that's fine. If you scale
horizontally, swap it for a Redis-backed limiter before turning on a
second replica.

---

## Troubleshooting

**api stuck waiting for postgres** (compose) — check
`docker compose logs postgres`. The pgvector image enables extensions
automatically; if you swap in a custom image you must install them
yourself.

**`401 unauthorized` after login** (Railway split-subdomain) — cookie
domain not shared. Confirm `HELIA_COOKIE_DOMAIN=.gethelia.dev` on the
api service. Devtools → Application → Cookies → `helia_session`
should list `.gethelia.dev` as the domain.

**`CORS preflight failed`** — `HELIA_CORS_ORIGIN` doesn't include the
exact origin. Schemes matter, no trailing slash:
`https://app.gethelia.dev`.

**Customer's widget shows "API unreachable"** — `HELIA_CORS_ORIGIN`
doesn't include their domain, OR their origin isn't in the workspace's
embed allowlist (server-side check). Add it from `/settings → Embed
allowlist`.

**Verification email never arrives** — `RESEND_API_KEY` not set OR DNS
for `gethelia.dev` not verified in Resend. The link is also printed to
the api logs as a fallback.

**Postgres "too many connections"** (Neon) — using the unpooled URL.
Switch `DATABASE_URL` to the pooled string (has `-pooler` in hostname).

**Widget on a customer site shows stale brand** — `/v1/widget/config`
sets a 60-second cache. Wait a minute, or hard-refresh.

**OpenAI errors in the agent** (compose) — confirm `OPENAI_API_KEY` is
set in the root `.env` (not `apps/api/.env`, that's the dev-only
path). Restart with `docker compose restart api`.
