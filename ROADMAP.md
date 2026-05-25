# Roadmap

This is what Helia is going to be and when. Working document — things will
move. The detailed sprint plan for what's shipping next lives in
[`V1.md`](V1.md).

Today (2026-05-22) Helia is a working AI assistant product with sources,
HTTP tools, an embeddable widget, branding, a dashboard, and a settings
page. It is not yet self-host-deployable, has no admin auth, and does not
verify end-user identity. Those gaps are the five sprints of v1.

## Vision

> Open-source AI assistant that companies self-host (or run on our cloud)
> to embed in their SaaS for their authenticated users. One workspace per
> company, identity verified via HMAC, tools scoped to the real user.

The same widget supports two modes:

1. **Anonymous** — public visitors. Generic FAQ, marketing pages, support.
2. **Identified** — authenticated end-users of the customer's app. Per-user data scoping via HMAC-signed tokens.

Identified mode is the primary target — it's what makes Helia integrable
into a real B2B SaaS dashboard.

## Current status

See [`V1.md`](V1.md) for the line-by-line state and the five sprints to
v1. Summary:

- ✓ Product features: sources, tools, widget, brand, dashboard, settings, observability
- ✓ Architecture: monolith, one Postgres, no queue
- ✓ Code health: TS strict, no orphan code, consistent UI (shadcn + hugeicons)
- ✗ Deploy story (sprint 1)
- ✗ Admin auth (sprint 2)
- ✗ Identified user mode (sprint 3)
- ✗ Production safety — rate limits, encrypted secrets (sprint 4)
- ✗ Conversations / moderation page (sprint 5)

Target ship date for v1: **2026-06-05** (2 weeks from now).

## v1 — see V1.md

Five focused sprints, ~17 hours of work, calendar 2 weeks. The full plan
with definition-of-done per sprint is in [`V1.md`](V1.md).

When v1 ships, the customer can:

- `docker compose up` Helia on their own infra
- Sign in to the admin (gated, owner-only)
- Configure sources, tools, widget brand
- Drop a script tag in their app
- Pass signed user identity from their backend (HMAC)
- See dashboard metrics + a moderation view of all conversations
- Trust that secrets are encrypted at rest and rate-limited at the edge

## v1.5 — driven by feedback

After the first paying customers run v1, the next sprint cycle is decided
by what they actually ask for. Probable candidates:

- **`@helia/server` SDK** — npm package with one function (`signIdentity`) that
  collapses the install token endpoint from ~15 lines of crypto to 3. The
  customer keeps their own auth lookup, drops in the helper, ships. Cost is
  mostly the publishing pipeline (npm org, build, release), not the code.
- **`@helia/react` SDK** — typed React hooks for embedding (`<HeliaWidget />`,
  `useHelia()`). Pairs with `@helia/server` so a Next.js install is a server
  route + a single React component, both copy-paste-able.
- **Memory tuning** — sliding window and summarization for long
  conversations, when full-history-per-call gets expensive
- **Multi-workspace** — one Helia install hosting bots for multiple
  customers (only matters for our hosted cloud)
- **Conversation grouping by session** — the column exists, the widget
  needs to send a session ID
- **Mobile responsive admin** — when the first owner asks
- **Sentry / OTel integration** — when the first production bug hits

## RAG quality — known wins, post-v1

Today's retrieval is single-pass HNSW over pgvector. Good enough to ship.
These are the upgrades that move quality without rewriting the stack.
Ordered by ROI:

1. **Reranker** — top-50 vector hits → cross-encoder → top-5 to LLM.
   Cohere Rerank (managed) or BGE-reranker (self-host). Biggest single
   quality bump for one weekend of work. Trigger: customers complain the
   bot picks the wrong chunk.
2. **Hybrid retrieval** — the `tsv` column already exists for BM25. Fuse
   vector + lexical scores via Reciprocal Rank Fusion. Pure vector loses
   on exact-match queries like error codes, SKUs, names. Trigger: first
   "why didn't it find X when X is literally in the doc?"
3. **Better PDF parsing** — current extractor handles clean PDFs, struggles
   with scanned/layout-heavy docs. Swap to LlamaParse or Unstructured.io
   behind a feature flag. Trigger: a customer uploads invoices/contracts
   and quality drops.
4. **Eval harness** — small offline set of (question, expected source) per
   workspace. Run before deploys. You can't improve what you can't measure.
   Trigger: about to ship anything that touches retrieval.
5. **Embedding model refresh** — when text-embedding-3-large beats small
   by enough margin to justify re-embedding costs. Plan the re-embed path
   now so it's not a panic later.

Vector DB stays Postgres + pgvector through all of this. Only consider
Pinecone / Qdrant / Weaviate when a single workspace exceeds ~1M chunks
or hybrid query p95 drifts past 200ms with proper indexes. The
`packages/rag/` module owns search end-to-end, so swapping the backend
is a one-package change when the day comes.

## v2 — once we have signal

Decided by reality, not guesses. Likely seeds:

- Slack / WhatsApp channels — same agent, different transports
- Workflow builder on top of the tool registry
- Eval harness as a feature
- Multi-provider LLMs (Mistral, Anthropic, Ollama)
- Lead capture, human handoff
- Stripe billing (cloud only)

## Decisions that stay

These are not coming back, on purpose:

- Separate worker process or queue — one Postgres until a real bottleneck
- Plugin system — tools imported as TS, no dynamic loading until 3+ live extensions exist
- Direct database connectors — Helia never gets a customer's DB credentials. Tools call their API.
- Provider lock-in — we keep the abstraction in `@helia/agent` even though we only ship OpenAI now

## How we decide what ships

Three rules.

1. No new feature without a named user who asked for it.
2. No abstraction before three concrete cases exist.
3. Every shipped feature comes with the smallest evaluation we can write for it. If we cannot tell whether it works, we did not ship it.

## Source of truth

This file gives the long arc. [`V1.md`](V1.md) is what's actually being
worked on right now.
