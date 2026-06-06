# RAG under the hood

RAG means retrieval-augmented generation. Helia does not train a model on a
company's docs. It retrieves the most relevant chunks from that company's
knowledge base at chat time, gives those chunks to the LLM through the
`search_knowledge` tool, and asks the model to answer from that context.

This keeps customer data tenant-scoped, updateable, and cheap to query.

## The pipeline

Helia has two paths: ingestion and retrieval.

Ingestion runs when a workspace owner uploads or connects a source:

```txt
PDF / text / URL
  -> extract readable text
  -> split text into chunks
  -> embed each chunk
  -> store chunk + metadata + vector in Postgres
```

Retrieval runs during a chat turn:

```txt
user question
  -> embed the question
  -> vector search in pgvector
  -> full-text search in Postgres
  -> fuse both ranked lists with RRF
  -> return top chunks to the agent
  -> LLM answers with citations
```

The implementation lives in `packages/rag`. The API exposes it through the
built-in `search_knowledge` tool in `apps/api`.

## Ingestion

Sources become rows in `sources`; chunks become rows in `chunks`.

For each source, Helia:

1. Marks the source as `processing`.
2. Writes progress events to `source_events`.
3. Extracts plain text.
4. Splits text with a recursive character splitter.
5. Adds document context to the text sent for embedding.
6. Embeds chunks in batches.
7. Stores chunk content, metadata, token estimate, and embedding.
8. Marks the source `ready` or `failed`.

Chunk metadata can include:

- document title
- page
- section
- URL

The current chunker aims for roughly 600 tokens with overlap. It is simple and
predictable, which is good for an early product. The next quality upgrade is
structure-aware chunking for Markdown, docs, and clean HTML sections.

## Retrieval

Helia uses hybrid retrieval because neither vector search nor keyword search is
enough by itself.

Vector search is good for meaning:

```txt
"How do I cancel?"
```

can match:

```txt
"To terminate your subscription..."
```

Full-text search is good for exact terms:

```txt
"SOC2", "6920Z", "API-KEY-403"
```

can match exact codes, acronyms, product names, and error strings.

Helia runs both searches inside Postgres:

- vector top 20 using pgvector cosine distance
- full-text top 20 using generated `tsv`
- Reciprocal Rank Fusion merges candidates
- final top 5 chunks go back to the agent

Everything is filtered by `workspace_id`, so one company's docs do not leak into
another company's retrieval.

## Why Postgres + pgvector

For the first 50 SMB customers, Postgres + pgvector is the right default:

- one database to operate
- transactional source/chunk deletes
- workspace filtering is simple
- full-text search and vector search live together
- backups and self-hosting stay easy

Do not add Pinecone, Qdrant, Weaviate, or another vector database until a real
measurement forces it. A separate vector database adds sync bugs, extra ops,
and more tenant-isolation surface area.

## Current limits

The first production target is light-support SMB usage: tens of sources per
workspace and tens to hundreds of chat turns per month.

Current safety limits:

- source text: 1,000,000 extracted characters
- source chunks: 2,000 chunks
- URL crawl: 50 pages by default, 200 pages maximum
- PDF upload: 50 MB maximum
- default retrieval: vector top 20, full-text top 20, final top 5

These limits are intentionally conservative. They keep ingestion predictable
while Helia is still running without a separate worker system.

## What can fail

Most bad answers come from one of these problems:

- The source does not contain the answer.
- The source text was extracted badly, especially from layout-heavy PDFs.
- The chunk is too small, too large, or missing its surrounding section title.
- Retrieval found related chunks but not the exact answer.
- The model ignored or overgeneralized the retrieved context.
- The workspace has too many noisy pages from a broad crawl.

Debug in this order:

1. Open the source and confirm the answer exists.
2. Inspect the chunks returned in the conversation trace.
3. Check retrieval metrics in the raw `search_knowledge` tool step.
4. Add the question to the workspace eval set.
5. Fix extraction, chunking, or source copy before changing models.

## Quality checks

Every serious workspace should have a small eval file: real user questions with
the expected source title, URL, or chunk id.

Run:

```bash
pnpm rag:eval -- --workspace <workspace-id> --file packages/rag/evals/retrieval.example.json --min-pass-rate 0.8
```

Initial bar for the first 50 SMBs:

- top-5 retrieval pass rate at least 80%
- no ranking change without running evals
- failed evals become source, extraction, or chunking work

Use `--min-pass-rate 1` when changing ranking logic and the curated eval set
should fully pass.

## Performance checks

The `search_knowledge` tool stores retrieval metrics in raw chat trace steps:

- `embedMs`
- `sqlMs`
- `totalMs`
- `resultCount`

The dashboard exposes average and p95 monthly response latency.

Initial targets:

- retrieval SQL p95 under 200 ms
- chat first token p95 under 3 seconds
- full answer p95 under 8 seconds
- ingestion failures visible in source events

If chat is slow, separate the problem:

- high `embedMs`: embedding provider latency or rate limits
- high `sqlMs`: Postgres/index/corpus issue
- high LLM time but low retrieval time: model/provider latency
- high ingest time: crawler, PDF extraction, or embedding batch pressure

## Scaling path

Scale in this order.

1. **Measure first**
   Add evals and watch p95 latency before changing architecture.

2. **Tighten source quality**
   Better crawls, cleaner extraction, and better chunk metadata usually improve
   quality more than swapping databases.

3. **Add durable ingestion**
   Move ingestion from in-process execution to a queue when multiple customers
   ingest concurrently or jobs must survive deploys/restarts.

4. **Add distributed rate limits**
   The current rate limiter is in-process. Use Redis before running multiple
   API instances.

5. **Add query caching**
   Cache repeated question embeddings and possibly common retrieval results for
   short windows. Many support questions repeat.

6. **Add reranking**
   Retrieve top 50 candidates, rerank them with a managed reranker or
   self-hosted model, then send top 5 to the LLM. Do this only after evals
   exist, so the quality gain is measurable.

7. **Consider a vector database**
   Only consider this when a single workspace approaches very large chunk counts
   or measured Postgres retrieval p95 cannot be fixed with indexes and query
   tuning.

## When to change models

Helia currently uses `text-embedding-3-small` with 1536-dimensional vectors.
Changing embedding models means re-embedding all chunks because vector spaces
are not compatible.

Before changing embedding models, add:

- `embedding_model` metadata
- a reindex path per source/workspace
- eval comparison between old and new embeddings
- a rollback path

For most early SMB use cases, better extraction, chunking, and reranking will
matter more than a larger embedding model.
