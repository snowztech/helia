## Vision

> Open-source AI assistant that companies self-host (or run on our cloud)
> to embed in their SaaS for their authenticated users. One workspace per
> company, identity verified via HMAC, tools scoped to the real user.

The same widget supports two modes:

1. **Anonymous** — public visitors. Generic FAQ, marketing pages, support.
2. **Identified** — authenticated end-users of the customer's app. Per-user data scoping via HMAC-signed tokens.

Identified mode is the primary target. It's what makes Helia integrable
into a real B2B SaaS dashboard.

## Shipped (v1)

- `docker compose up` to self-host on any Linux box
- Admin auth, email verification, password reset
- HMAC-signed end-user identity, scoped tool calls
- Conversations/moderation view, per-workspace ban list
- Per-workspace embed allowlist (server-side enforced)
- Rate limiting, encrypted secrets at rest, token quotas
- Streaming chat (Vercel AI SDK), citations, French + English widget chrome

## Next up

Roughly ordered by expected impact. Items move as real feedback lands.

### SDKs and install DX

`@gethelia/server` exposes `signIdentity(user, secret)` and
`identityHeaders(user, secret)`. `@gethelia/react` wraps the vanilla widget
as `<HeliaWidget />` for React/Next.js apps. The script tag remains the
lowest-friction path; SDKs are for teams that want typed integration.

### RAG quality

Today’s retrieval is hybrid vector + Postgres full-text with RRF. Good
enough to ship, but not yet objectively measured. Upgrades that move
quality without rewriting the stack, in order of ROI:

1. **Eval harness** — small offline set of (question, expected source)
   per workspace. Run before deploys and before ranking changes.
2. **Reranker** — top-50 candidates → cross-encoder → top-5 to LLM.
   Cohere Rerank (managed) or BGE-reranker (self-host). Biggest single
   quality bump once evals exist.
3. **Better PDF parsing** — current extractor handles clean PDFs,
   struggles with scanned or layout-heavy docs. LlamaParse or
   Unstructured.io behind a feature flag.
4. **Embedding model refresh** — when text-embedding-3-large beats small
   by enough margin to justify re-embedding costs. Plan the re-embed path
   now so it isn't a panic later.

Vector DB stays Postgres + pgvector through all of this. Only consider
Pinecone, Qdrant, or Weaviate when a single workspace exceeds ~1M chunks,
or hybrid query p95 drifts past 200ms with proper indexes. The
`packages/rag/` module owns search end-to-end, so swapping the backend is
a one-package change when the day comes.

### Operational polish

- **Memory tuning** — sliding window and summarization for long
  conversations, when full-history-per-call gets expensive.
- **Conversation debugging depth** — traces exist; keep making “why this
  answer?” obvious in the admin before adding more complex agent behavior.
- **Mobile responsive admin** — when the first owner asks.
- **Sentry / OTel integration** — when the first production bug hits.

## Later

Decided by reality, not guesses. Likely seeds:

- Slack / WhatsApp channels — same agent, different transports
- Workflow builder on top of the tool registry
- Multi-provider LLMs (Anthropic, Mistral, Ollama)
- Lead capture, human handoff
- Stripe billing (hosted cloud only)
- Multi-workspace per account (team plan)

## Decisions that stay

These are not coming back, on purpose:

- Separate worker process or queue. One Postgres until a real bottleneck.
- Plugin system. Tools imported as TS, no dynamic loading until 3+ live
  extensions exist.
- Direct database connectors. Helia never gets a customer's DB
  credentials. Tools call their API.
- Provider lock-in. We keep the abstraction in `@helia/agent` even though
  we only ship OpenAI now.

## How we decide what ships

Three rules.

1. No new feature without a named user who asked for it.
2. No abstraction before three concrete cases exist.
3. Every shipped feature comes with the smallest evaluation we can write
   for it. If we cannot tell whether it works, we did not ship it.
