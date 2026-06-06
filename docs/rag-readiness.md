# RAG readiness

Helia's first production target is 50 light-support SMB workspaces: tens of
sources per company and tens to hundreds of chat turns per month. For that
shape, Postgres + pgvector is the default. Do not add a separate vector
database until measured latency or corpus size proves it is needed.

For the deeper explanation of the pipeline and scaling model, read
[`docs/rag.md`](./rag.md).

## Current baseline

- Retrieval is hybrid: pgvector cosine search + Postgres full-text search,
  fused with reciprocal rank fusion.
- Retrieval is workspace-scoped.
- Ingestion batches embeddings and stores chunks in Postgres.
- Chat traces store raw tool steps, including retrieval timing metrics.
- The dashboard exposes monthly average and p95 response latency.

## Quality gate

Every serious workspace should have a small eval file with real customer
questions and expected sources.

```bash
pnpm rag:eval -- --workspace <workspace-id> --file packages/rag/evals/retrieval.example.json --min-pass-rate 0.8
```

Use `--min-pass-rate 1` when changing ranking logic and you expect every
curated case to pass.

Initial target for the first 50 SMBs:

- top-5 retrieval pass rate: at least 80%
- no ranking change ships without running the eval set
- failed evals become either ingestion fixes, source copy fixes, or new
  expected-source cases

## Performance gate

Initial targets:

- retrieval SQL p95: under 200 ms
- chat first token p95: under 3 seconds
- full answer p95: under 8 seconds
- ingestion failures are visible in source events

The `search_knowledge` tool returns retrieval metrics in the raw trace steps:

- `embedMs`
- `sqlMs`
- `totalMs`
- `resultCount`

Use conversation traces when debugging a slow or bad answer before changing
the retrieval algorithm.

## Safety limits

Default ingestion limits are intentionally conservative for the first 50 SMBs:

- source text: 1,000,000 extracted characters
- source chunks: 2,000 chunks
- URL crawl: 50 pages by default, 200 pages maximum
- PDF upload: 50 MB maximum

Raise these per customer only after checking Postgres size, ingestion time,
OpenAI embedding limits, and retrieval latency.

## Upgrade order

1. Add workspace-specific eval files for real customers.
2. Add more trace UI around retrieved chunks and timings.
3. Add Redis-backed rate limiting before running multiple API instances.
4. Move ingestion to a durable queue when multiple customers ingest at once.
5. Add a reranker only after evals prove the baseline and can measure gains.
