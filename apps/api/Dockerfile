# syntax=docker/dockerfile:1.6
#
# Helia API. Build context = repo root (monorepo with pnpm workspaces).
# Two stages: deps (cached install) → runtime.
#
# Migrations run as a pre-deploy step (see Railway settings), not on every
# boot. The runtime container only starts the api process.

ARG NODE_VERSION=22-alpine
ARG PNPM_VERSION=9.15.0

# ─── deps ────────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION} AS deps
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate
WORKDIR /repo

# Manifests first → install layer caches when only sources change.
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/agent/package.json packages/agent/
COPY packages/config/package.json packages/config/
COPY packages/db/package.json packages/db/
COPY packages/rag/package.json packages/rag/
COPY packages/widget/package.json packages/widget/

RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# ─── runtime ─────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION}

LABEL org.opencontainers.image.title="helia-api" \
      org.opencontainers.image.source="https://github.com/snowztech/helia" \
      org.opencontainers.image.licenses="AGPL-3.0"

# tini reaps zombies and forwards SIGTERM properly. wget for healthchecks.
RUN corepack enable && apk add --no-cache tini wget && \
    addgroup -S helia -g 1001 && adduser -S helia -G helia -u 1001
WORKDIR /repo

# Installed deps from the deps stage. Workspace packages each have their
# own node_modules alongside the root one.
COPY --from=deps --chown=helia:helia /repo/node_modules ./node_modules
COPY --from=deps --chown=helia:helia /repo/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps --chown=helia:helia /repo/packages/agent/node_modules ./packages/agent/node_modules
COPY --from=deps --chown=helia:helia /repo/packages/config/node_modules ./packages/config/node_modules
COPY --from=deps --chown=helia:helia /repo/packages/db/node_modules ./packages/db/node_modules
COPY --from=deps --chown=helia:helia /repo/packages/rag/node_modules ./packages/rag/node_modules

# Sources for api + the workspace packages it imports.
COPY --chown=helia:helia pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY --chown=helia:helia apps/api ./apps/api
COPY --chown=helia:helia packages/agent ./packages/agent
COPY --chown=helia:helia packages/config ./packages/config
COPY --chown=helia:helia packages/db ./packages/db
COPY --chown=helia:helia packages/rag ./packages/rag

USER helia
WORKDIR /repo/apps/api
ENV NODE_ENV=production PORT=4000
EXPOSE 4000

HEALTHCHECK --interval=10s --timeout=3s --start-period=30s --retries=5 \
  CMD wget -qO- http://localhost:4000/v1/health > /dev/null || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["pnpm", "exec", "tsx", "src/main.ts"]
