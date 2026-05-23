# syntax=docker/dockerfile:1.6
#
# Helia admin (Next.js App Router). Build context = repo root.
# Three stages: deps → build → runtime.
#
# next.config.ts uses `output: 'standalone'`, which produces a minimal
# Node server. The runtime image carries no node_modules beyond what
# Next traced.

ARG NODE_VERSION=22-alpine
ARG PNPM_VERSION=9.15.0

# ─── deps ────────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION} AS deps
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate
WORKDIR /repo

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/agent/package.json packages/agent/
COPY packages/db/package.json packages/db/
COPY packages/rag/package.json packages/rag/
COPY packages/widget/package.json packages/widget/

RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# ─── build ───────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION} AS build
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate
WORKDIR /repo

# Sources the web build needs:
#   - apps/web itself
#   - packages/widget (the prebuild script bundles it into public/w.js)
COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /repo/packages/widget/node_modules ./packages/widget/node_modules
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web ./apps/web
COPY packages/widget ./packages/widget

WORKDIR /repo/apps/web
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

# ─── runtime ─────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION}

LABEL org.opencontainers.image.title="helia-web" \
      org.opencontainers.image.source="https://github.com/snowztech/helia" \
      org.opencontainers.image.licenses="AGPL-3.0"

RUN apk add --no-cache tini wget && \
    addgroup -S helia -g 1001 && adduser -S helia -G helia -u 1001
WORKDIR /app

# Standalone output mirrors the monorepo tree under /app:
#   /app/node_modules         (traced subset)
#   /app/apps/web/server.js   (entrypoint)
# Static + public aren't part of standalone — copy them in.
COPY --from=build --chown=helia:helia /repo/apps/web/.next/standalone ./
COPY --from=build --chown=helia:helia /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=helia:helia /repo/apps/web/public ./apps/web/public

USER helia
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    NEXT_TELEMETRY_DISABLED=1
EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=3s --start-period=20s --retries=5 \
  CMD wget -qO- http://localhost:3000 > /dev/null || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "apps/web/server.js"]
