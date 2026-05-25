# Deploy Helia

Two production paths, pick one. Both ship the same monolith.

| Path | Cost / mo | Ops effort | When to pick |
|---|---|---|---|
| [Hetzner + Caddy](#hetzner--caddy-single-vps) | ~€4 | You own the box | Confident running a VPS, want the cheapest bill |
| [Railway + Neon](#railway--neon-managed) | ~$15–30 | Almost zero | Don't want to touch servers, OK paying for that |

Both reach the same end state: one Next.js admin UI + one Hono API
+ one Postgres. Customers embed `<script src=".../w.js">` on their site.

---

## Pre-flight

You need:

- A domain. Examples below use `gethelia.dev`.
- An OpenAI API key.
- A 32-byte master key: `openssl rand -hex 32`.
- (Optional) A Resend API key for verification emails. Without it,
  links are printed to the api logs — fine while iterating, not fine
  for paying customers.

The repo is deploy-ready:

- `apps/api/Dockerfile` + `apps/web/Dockerfile` build production images.
- `apps/api/scripts/migrate.ts` enables extensions and applies pending
  migrations. Run it as a pre-deploy step (Railway, Fly) or before the
  container starts (compose, k8s).
- `apps/web/next.config.ts` outputs a standalone Next.js bundle.
- `.env.example` documents every variable.

You should not need to edit Dockerfiles or build scripts.

---

## Hetzner + Caddy (single VPS)

Cheapest path. One box, one Caddyfile, one docker compose.

### 1. Provision

- Hetzner CX22 (€4/mo, 2 vCPU, 4 GB) is enough. DigitalOcean / Linode
  equivalents work the same.
- SSH in, install Docker:

  ```bash
  apt update && apt install -y docker.io docker-compose-plugin caddy
  ```

### 2. Clone + configure

```bash
git clone https://github.com/snowztech/helia
cd helia
cp .env.example .env
```

Edit `.env`:

```
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
- Wait ~30s, watch `docker compose logs -f api` for `helia-api listening`.
- Open `https://app.gethelia.dev` → signup page.

This path uses **one subdomain**. The Caddy `handle /v1/*` block routes
API traffic to the api container; everything else goes to web.
`HELIA_COOKIE_DOMAIN` is **not needed** because the session cookie
lives on the same host as the admin UI.

---

## Railway + Neon (managed)

Two Railway services + external Postgres. No server admin.

### 1. Neon

- Project at [neon.tech](https://neon.tech). Region matches Railway's
  region (US-East for Railway `us-east`).
- Connection Details → copy the **pooled connection string** (the one
  with `-pooler` in the hostname). Use this as `DATABASE_URL`.
- The `pgvector` and `pg_trgm` extensions get installed by Helia's
  pre-deploy migration step (`scripts/migrate.ts`). You don't need
  to enable them manually.

### 2. Railway: api service

- New project → Deploy from GitHub → pick your fork.
- Service settings:
  - **Root directory**: `apps/api`
  - **Builder**: Dockerfile (Railway auto-detects)
  - **Watch paths**: `/apps/api/**`, `/packages/**`, `/pnpm-lock.yaml`,
    `/package.json` — covers monorepo lockfile changes too
  - **Pre-deploy command**: `pnpm exec tsx scripts/migrate.ts` — runs
    migrations before traffic switches to the new container
  - **Healthcheck path**: `/v1/health` ← important, prevents a broken
    deploy from going live
  - **Memory limit**: 512 MB (start there, raise if needed)
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

  `HELIA_COOKIE_DOMAIN` matters: api and admin live on different
  subdomains here, and the leading dot lets the session cookie span both.

- Custom domain → `api.gethelia.dev`. Railway gives you a CNAME target;
  add it at your DNS host.

Deploy. Pre-deploy runs `migrate.ts` → container boots api. Logs:

```
✓ migrations applied
helia-api listening on http://localhost:4000
```

### 3. Railway: web service

- Same project → New service → same repo.
- Service settings:
  - **Root directory**: `apps/web`
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

⚠️ **Build-time gotcha**: `HELIA_API_URL` is read by `next.config.ts`
during the Docker build to bake `NEXT_PUBLIC_API_URL` into the browser
bundle. If you ever change it, you must **redeploy** the web service
(setting the env var alone doesn't update the browser bundle).

### 4. First boot

1. `https://app.gethelia.dev` → middleware sends you to `/login`.
2. Signup → check the api service logs for the verification link.
3. Verify → logged in.
4. Upload a source → ingest in `/sources`.
5. Embed the widget on a test page → chat → see it in `/conversations`.

---

## What still references `helia.snowztech.com`

Two strings in code hard-code the demo origin. Replace before launch:

- `apps/web/src/app/(app)/widget/page.tsx` → `WIDGET_PROD_URL`
- `apps/web/src/app/(app)/settings/_components/identity-section.tsx`
  → the `embedSnippet` template literal

Both should become `https://app.gethelia.dev/w.js`. Or pull from
`process.env.NEXT_PUBLIC_API_URL` if you want it to follow the
environment automatically.

---

## After launch

### Backups

Neon: 24h snapshots on free, point-in-time-restore on Scale.

Hetzner: snapshot the volume periodically, or run `pg_dump` to S3 /
Backblaze on a cron.

### Monitoring

Both Railway and Caddy show request logs. For real visibility plan to
add structured logging + an error tracker (Sentry) when you have real
traffic. Not v1 blocking.

### Scaling

You'll outgrow Neon's 3 GB free tier before you outgrow Railway's
compute. Plan to upgrade Neon ($19/mo Scale) when storage approaches
the limit.

The in-process rate limiter (`apps/api/src/lib/rate-limit.ts`) holds
counters in memory. With one api replica that's fine. If you scale
horizontally on Railway, swap it for Redis-backed before turning on a
second replica.

---

## Troubleshooting

**`401 unauthorized` after login (Railway only)** — cookie domain not
shared. Confirm `HELIA_COOKIE_DOMAIN=.gethelia.dev` on the api
service. Devtools → Application → Cookies → `helia_session` should
list `.gethelia.dev` as the domain.

**`CORS preflight failed`** — `HELIA_CORS_ORIGIN` doesn't include the
exact origin. Schemes matter, no trailing slash:
`https://app.gethelia.dev`.

**Customer's widget shows "API unreachable"** — `HELIA_CORS_ORIGIN`
doesn't include the customer's domain. Add it (comma-separated).

**Verification email never arrives** — `RESEND_API_KEY` not set OR
DNS for `gethelia.dev` not verified in Resend. The link is also
printed to the api logs as a fallback.

**Postgres "too many connections"** — using the unpooled Neon URL.
Switch `DATABASE_URL` to the pooled connection string (has `-pooler`
in the hostname).

**Widget on a customer site shows stale brand** — `/v1/widget/config`
sets a 60-second cache. Force refresh by waiting a minute or by
rebuilding the widget bundle (the URL changes).
