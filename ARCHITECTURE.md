# Architecture

This document explains how Helia is put together. Read it after the README if you want to contribute or understand the design choices.

## The big picture

Helia has two running processes and three libraries.

```
apps/api    Hono HTTP server. Owns the database and runs the agent.
apps/web    Next.js UI. Talks to the API over HTTP.

packages/db     Drizzle schema. Postgres client factory.
packages/rag    Document pipeline. Extract, chunk, embed, retrieve.
packages/agent  Generic agent loop. Persona, tools, multi step.
```

`apps/api` imports all three packages. `apps/web` only knows the API contract. The split lets anyone use the API standalone or build a different UI on top.

Postgres holds everything. Tenant data, vectors, full text indexes, and job state (if we add a queue later) all live in the same database. No Redis, no Pinecone, no separate queue. This stays simple as long as we run on one machine. The schema is multi tenant from day one so adding auth later does not require migrations.

## What happens when you upload a source

The web UI sends a request to one of the upload endpoints. The API creates a row in the `sources` table with status `queued`, then runs the ingest pipeline. PDF and plain text run inside the request because they finish in a few seconds. URL crawls are fired and forgotten with `void runIngestUrl(...).catch(...)` so the response returns immediately. The client polls the source detail endpoint to follow progress.

Each ingest step writes a row to `source_events`. The web UI renders this as a timeline on the source detail page. When the model fails to extract any content, the source moves to `failed` and the error message lands in the same table. Re running an ingest on an existing source first clears its chunks, so the table never has stale data from a previous indexing.

## The RAG pipeline

The retrieval pipeline lives in `packages/rag`. Each step is a plain function. Composition happens in `ingest.ts`.

**Extract.** PDFs go through `pdf-parse`. HTML pages go through `jsdom` and Mozilla Readability so we get the main content and drop navigation, footers, and sidebars. Plain text passes through unchanged. The output is normalized text.

**Chunk.** A recursive character splitter cuts the text into pieces of about 600 tokens, with an overlap of 80 tokens. The splitter tries paragraph breaks first, then line breaks, then sentence boundaries, then spaces. It falls back to a hard split only when no separator is found. Before embedding, each chunk gets a small header with the doc title prepended. This is the LangChain pattern and it helps the embedding capture the doc context.

**Embed.** OpenAI `text-embedding-3-small` returns 1536 dimensional vectors. We batch up to 64 chunks per request and retry on transient errors with exponential backoff. The schema fixes the dimension count to 1536. Switching providers means re indexing because vectors from different models live in different spaces.

**Store.** Chunks land in Postgres with their embedding (`pgvector`), a generated `tsvector` for full text search (`simple` config so it stays language agnostic), and a JSONB metadata field with the doc title and source URL. An HNSW index on the vector column gives sub linear nearest neighbor search. A GIN index on the tsvector serves full text lookups.

**Retrieve.** When a question comes in, we run a hybrid search. One query embeds the question and pulls the top 20 chunks by cosine distance. A parallel query uses Postgres full text search to pull the top 20 by `ts_rank`. We then fuse the two ranked lists with Reciprocal Rank Fusion and keep the top 5. RRF is robust and needs no weight tuning, which makes it a good default. The whole thing runs as a single SQL statement using CTEs.

**Prompt.** The retrieved chunks would have gone straight into the system prompt under classical RAG. We removed that. The agent fetches them through a tool when it decides it needs them.

## The agent loop

`packages/agent` wraps the Vercel AI SDK with a persona system and a tool registry. The runner takes a persona, a list of messages, and a tool set, then calls `streamText` with `maxSteps: 5`. The SDK drives the LLM and the tool round trips internally. From the outside you get a stream you can pipe to an HTTP response.

The persona prompt is built from the workspace name, locale, and the list of tools the model has this turn. We do not stuff retrieved chunks into the system prompt anymore. The model decides when to call `search_knowledge` based on the question. For greetings and small talk it answers directly without a tool call. For factual questions it issues a search, reads the result, and either answers or searches again with a different query.

Tools live in two places. The interface (a record of `tool({ description, parameters, execute })` entries) is declared in `apps/api/src/agent/tools.ts` where they bind to the database. The generic loop in `@helia/agent` stays workspace agnostic. Adding a tool means writing one entry. The description is auto injected into the persona prompt the next time the loop runs.

The current tool set has one entry, `search_knowledge`. Future tools will let the agent take action. Booking an appointment, sending an email, escalating to a human, opening a ticket. The same registry pattern handles them.

## The Postgres schema

```
workspaces       id, name, locale, created_at
sources          id, workspace_id, name, type, status, progress, error, config, stats
chunks           id, workspace_id, source_id, content, tokens, metadata, embedding, tsv
source_events    id, source_id, level, message, data, created_at
```

`workspace_id` is on every row that is tenant data. Every query must filter on it. This is the kind of invariant that wants automated checks. We do not have those yet. They are on the roadmap.

The tsvector column is a generated stored column. Drizzle does not have a first class API for tsvector yet, so the column starts life as a plain text placeholder. The bootstrap script (`pnpm db:init`) drops it and recreates it with `GENERATED ALWAYS AS (to_tsvector('simple', coalesce(content, '')))`. The script is idempotent and safe to re run.

## End to end request

Putting it all together for a chat message.

```
browser POST /v1/chat                  apps/web/src/app/chat
   -> apps/api routes/chat.ts          validate body with zod
   -> runAgent (packages/agent)        build prompt, call streamText
       LLM decides
       -> tool search_knowledge        apps/api/src/agent/tools.ts
           -> retrieve (packages/rag)  hybrid SQL on Postgres
           -> return chunks            JSON back to model
       LLM writes answer
   -> SSE stream back to browser       parts include text + tool calls
   web UI renders parts                <ToolInvocation> + text
```

If you replace `runAgent` with the old forced retrieval, you get a classical RAG chatbot. The shape of the rest is the same.

## Why these choices

A few decisions are worth calling out.

**One Postgres, no extra queue.** A separate worker process and pg-boss queue were in an earlier iteration. They added moving parts without buying us anything at this scale. We collapsed them into the API process. URL crawls run as `void runIngestUrl()` so the response is fast. The web UI polls. When ingestion volume justifies a worker, the package boundary makes the split easy.

**Hybrid retrieval, not vector only.** Vector search alone misses keyword queries like codes, names, and exact identifiers. Full text search alone misses paraphrases. RRF combines both with no weight tuning. The cost is one extra SQL CTE.

**Agent over forced RAG.** Forced retrieval on every message is wasteful for greetings and small talk, and it gives the model no chance to reformulate. The tool approach lets the agent search when it needs to and skip when it does not. It also opens the door to action tools later. The cost is more LLM round trips on factual questions.

**TypeScript end to end.** API in Hono, UI in Next.js, packages in plain TypeScript. One language across the stack, no FFI, no protocol translation between services. The runtime cost on top of Go would be a few milliseconds per request. We pay it for the velocity.

**OpenAI as the default provider.** `gpt-4o-mini` for chat, `text-embedding-3-small` for embeddings. Both are cheap and good enough for support workloads. The provider is swappable through the Vercel AI SDK, and we plan to support Mistral and Anthropic for users who need EU hosting.

## What is not in the codebase yet

Auth and multi tenant routing. We have the columns and the queries are tenant scoped, but the API trusts the caller. Anyone can hit `/v1/sources` and see the default workspace. Adding `better-auth` and an authentication middleware is the next milestone.

Evaluation. We do not have a test set or any quality metric on retrieval or answers. The plan is to ship a small eval harness that runs a fixed set of questions, expected sources, and reference answers against the live API. It runs in CI and prints recall and answer correctness scores. Without this we are flying blind on quality changes.

Rate limiting and abuse protection. The chat endpoint is wide open. A single visitor can burn a lot of tokens. We need per IP and per workspace quotas before the API faces public traffic.

The widget. The plan is a 30 KB vanilla JavaScript embed that businesses can drop on their website. Today there is no widget package, only an admin UI and a hosted chat page.

Tool palette beyond search. The agent has one tool. The roadmap has booking, escalation, lead capture, and ticket creation. The registry pattern is in place. Each tool is one file.
