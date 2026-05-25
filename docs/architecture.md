# Architecture

How Helia is put together. Read this after the README if you want to
contribute or understand the design choices.

## The big picture

Two running processes, four shared packages.

```
apps/
├── api          Hono HTTP server. Owns Postgres, runs the agent, signs sessions.
├── web          Next.js admin UI. Talks to the API over HTTP.
└── landing      Next.js marketing site. Static, no API access.

packages/
├── agent        Generic agent loop. Persona, tools, multi-step.
├── config       Shared env loader (root .env).
├── db           Drizzle schema. Postgres client factory.
├── rag          Document pipeline. Extract, chunk, embed, retrieve, crawl.
└── widget       Vanilla TS embed bundle (~25 KB, shadow DOM).
```

`apps/api` imports the runtime packages (agent, config, db, rag).
`apps/web` only knows the API contract. `packages/widget` builds to a
single `w.js` served as a public asset by `apps/web`. The split lets
anyone build a different UI on top of the API, or distribute the
widget without the rest of the stack.

Postgres holds everything. Tenant data, vectors, full-text indexes,
sessions, and rate-limit counters all live in one database. No Redis,
no Pinecone, no separate queue. This stays simple as long as we run on
one or two machines. The schema is multi-tenant from day one.

## End-to-end request

A chat message from the embedded widget:

```
widget POST /v1/chat                     packages/widget/src
   -> apps/api routes/chat.ts            zod validate, resolve workspace
   -> checkWorkspaceOrigin               reject if origin not in allowlist
   -> verifyIdentity (HMAC)              decode signed user, optional
   -> tokensUsedThisMonth                 enforce monthly quota
   -> runAgent (packages/agent)          build prompt, call streamText
       LLM decides
       -> tool search_knowledge          apps/api/src/agent/tools.ts
           -> retrieve (packages/rag)    hybrid SQL on Postgres
           -> return chunks              JSON back to the model
       LLM writes the answer
   -> SSE stream back to the browser     text + tool-call parts
   widget renders parts                  citations + bot bubble
```

## Auth

Session-cookie auth. Sign-up creates a user with a bcrypt password
hash, a verification email, and a fresh workspace. The user becomes the
owner via `workspace_members`. Login validates the password, creates a
row in `sessions`, and sets `helia_session` (httpOnly, secure,
same-site, optional domain via `HELIA_COOKIE_DOMAIN`).

`/v1/*` (except auth and widget routes) runs through `authMiddleware`,
which loads the user + workspace from the cookie. Public widget routes
echo any Origin so the embedded widget can reach the API from third-
party sites. Real enforcement happens server-side via the per-workspace
embed allowlist.

## End-user identity (HMAC)

The widget can carry a signed identity passed by the customer's
backend. Their server reads the logged-in user, signs the payload with
the workspace's identity secret (HMAC-SHA256, canonical JSON), and
returns `{ id, name?, signature }` from a token endpoint. The widget
calls that endpoint on mount and includes the signature on each chat
request. The API verifies the signature with the workspace's encrypted
secret (AES-256-GCM at rest) and stores the verified identity on the
chat trace. With `identityRequired=true`, anonymous chats are rejected
with 401.

## The RAG pipeline

The retrieval pipeline lives in `packages/rag`. Each step is a plain
function. Composition happens in `ingest.ts`.

**Extract.** PDFs go through `pdf-parse`. HTML pages go through
`jsdom` + Mozilla Readability so we get the main content and drop
navigation. Plain text passes through unchanged. Output is normalized
UTF-8 text.

**Chunk.** A recursive character splitter cuts the text into ~600
token pieces with 80 tokens of overlap. The splitter prefers paragraph
breaks → line breaks → sentence boundaries → spaces, and only hard-
splits when no separator is found. Each chunk gets the doc title
prepended before embedding, so the vector captures doc context.

**Embed.** OpenAI `text-embedding-3-small` returns 1536-dimensional
vectors. We batch up to 64 chunks per request and retry with backoff
on transient errors. The schema fixes the dimension count at 1536.
Switching providers means re-indexing.

**Store.** Chunks land in Postgres with their embedding (`pgvector`),
a generated `tsvector` for full-text search (`simple` config, language-
agnostic), and a JSONB metadata field with the doc title and source
URL. An HNSW index gives sub-linear nearest-neighbor search. A GIN
index serves full-text lookups.

**Retrieve.** When a question comes in we run a hybrid search: one
query embeds the question and pulls the top 20 by cosine distance, a
parallel query uses Postgres full-text search to pull the top 20 by
`ts_rank`. We fuse them with Reciprocal Rank Fusion and keep the top
5. RRF is robust and needs no weight tuning. The whole thing is one
SQL statement using CTEs.

## The agent loop

`packages/agent` wraps the Vercel AI SDK with a persona system and a
tool registry. The runner takes a persona, the conversation history,
and a tool set, then calls `streamText` with `maxSteps: 5`. The SDK
drives the LLM and the tool round-trips internally.

The persona prompt is built from the workspace's bot name, locale, and
the tools the model has this turn. We do not stuff retrieved chunks
into the system prompt. The model decides when to call
`search_knowledge` based on the question. For greetings and small
talk it answers directly without a tool call. For factual questions
it searches, reads, and either answers or searches again with
different keywords.

Tools live in two places. The generic loop (`@helia/agent`) is
workspace-agnostic. The concrete tool set is declared in
`apps/api/src/agent/tools.ts` where each entry binds to the database.
Adding a tool means writing one entry. The description is auto-injected
into the persona prompt the next time the loop runs.

Today's tools: `search_knowledge` (RAG retrieval) and per-workspace
HTTP tools the owner registers from the `/tools` admin page. Each HTTP
tool has a name, description, URL, method, parameter schema (zod
JSON), and optional encrypted headers.

## The Postgres schema

Core tables (full list in `packages/db/src/schema.ts`):

```
users              id, email, passwordHash, name?, emailVerifiedAt, createdAt
sessions           id (cookie value), userId, expiresAt
workspaces         id, name, locale, model, brand*, bot*, widget*,
                   identitySecret (encrypted), identityRequired,
                   tokenQuotaMonthly, allowedOrigins[]
workspace_members  workspaceId, userId, role (owner/admin/member)
sources            id, workspaceId, name, type, status, progress, error, config
chunks             id, workspaceId, sourceId, content, tokens, metadata,
                   embedding vector(1536), tsv tsvector (generated)
source_events      id, sourceId, level, message, data, createdAt
tools              id, workspaceId, name, description, url, method,
                   paramsSchema, headers (encrypted), enabled
chat_traces        id, workspaceId, conversationId, userId (signed),
                   userMessage, finalAnswer, totalTokens, steps, retrieval
banned_users       workspaceId, userId, reason, bannedAt, bannedBy
email_tokens       token, userId, purpose, expiresAt, usedAt
```

`workspaceId` is on every tenant row. Every query must filter on it.
The middleware loads the workspace from the session and route handlers
scope queries to it.

The `tsv` column is a generated stored column. The migration creates
it as `tsvector GENERATED ALWAYS AS (to_tsvector('simple',
coalesce(content, '')))`. `scripts/migrate.ts` runs the migrations
after installing `vector` and `pg_trgm`.

## Production safety

- **Encryption at rest.** Identity-signing secret and tool headers are
  encrypted with AES-256-GCM using `MASTER_KEY` (32 bytes hex). Stored
  ciphertext is never returned by the API. Only a "configured" flag.
- **Password hashing.** bcrypt with cost 10.
- **Rate limiting.** In-process limiter on `/v1/chat` (default 30
  req/min per IP). Single-replica only. Swap to Redis before scaling
  horizontally.
- **Token quotas.** Per-workspace monthly cap (`tokenQuotaMonthly`)
  enforced against the sum of `chat_traces.totalTokens` since the 1st.
  `/v1/chat` returns 402 when exceeded.
- **Embed allowlist.** Per-workspace `allowedOrigins[]` checked
  server-side on `/v1/chat` and `/v1/widget/config`. Browser CORS is
  advisory. This is the real lock.

## Why these choices

**One Postgres, no extra queue.** A separate worker process + pg-boss
queue lived here in an earlier iteration. They added moving parts
without buying us anything at this scale. We collapsed them into the
API. URL crawls run as `void runIngestUrl()` so the response is fast.
The web UI polls for progress. When ingestion volume justifies it, the
package boundary makes the split easy.

**Hybrid retrieval, not vector-only.** Vector search alone misses
keyword queries (error codes, names, SKUs). Full-text search alone
misses paraphrases. RRF combines both with no weight tuning. Cost is
one extra SQL CTE.

**Agent over forced RAG.** Forced retrieval on every message is
wasteful for greetings and small talk, and gives the model no chance
to reformulate. The tool approach lets the agent search when it needs
to and skip when it doesn't. It also opens the door to action tools
(booking, escalation) on the same registry.

**TypeScript end to end.** API in Hono, UI in Next.js, packages in
plain TypeScript. One language across the stack, no FFI, no protocol
translation between services. We pay a few milliseconds per request
vs. Go for the velocity.

**OpenAI as the default.** `gpt-4o-mini` for chat,
`text-embedding-3-small` for embeddings. Both are cheap and good
enough for support workloads. The provider is swappable through the
Vercel AI SDK. Anthropic and Mistral are on the roadmap.

## What's not in the codebase yet

**Eval harness.** We don't have a test set or any quality metric on
retrieval or answers. A small offline runner that scores a fixed set
of (question, expected source, reference answer) tuples is on the
roadmap. Without this we fly blind on quality changes.

**Multi-workspace per user.** The schema supports it
(`workspace_members` is many-to-many with roles), but the UI assumes
one workspace per user today.

**Plugin / extension system.** Tools are imported as TS at build time.
Dynamic loading is deferred until at least three live extensions
justify the abstraction.

**Multi-provider LLMs.** The agent layer is provider-agnostic via the
AI SDK; we just haven't wired Anthropic or Mistral yet.

See [`roadmap.md`](./roadmap.md) for what's next.
