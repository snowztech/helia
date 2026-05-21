import { sql } from "drizzle-orm";
import type { Db } from "@helia/db";
import { embedQuery } from "./embed";

export type RetrievedChunk = {
  id: string;
  content: string;
  metadata: {
    docTitle?: string;
    section?: string;
    page?: number;
    url?: string;
  } | null;
  score: number;
};

export type RetrieveOptions = {
  vectorTop?: number;     // candidates from vector search (default 20)
  ftsTop?: number;        // candidates from full-text (default 20)
  finalTop?: number;      // returned after fusion (default 5)
  rrfK?: number;          // RRF constant (default 60)
  minScore?: number;      // skip results below this score (default 0)
};

/**
 * Hybrid retrieval: cosine vector search + Postgres full-text, fused via RRF
 * (Reciprocal Rank Fusion). Filtered by workspace.
 *
 * Why hybrid: vector search alone misses keyword-heavy queries (codes,
 * acronyms, exact names). Full-text alone misses paraphrases. RRF combines
 * both ranked lists without tuning weights.
 */
export async function retrieve(
  db: Db,
  workspaceId: string,
  query: string,
  opts: RetrieveOptions = {},
): Promise<RetrievedChunk[]> {
  const vectorTop = opts.vectorTop ?? 20;
  const ftsTop = opts.ftsTop ?? 20;
  const finalTop = opts.finalTop ?? 5;
  const rrfK = opts.rrfK ?? 60;
  const minScore = opts.minScore ?? 0;

  const vec = await embedQuery(query);
  const vecLiteral = `[${vec.join(",")}]`;

  const rows = await db.execute(sql`
    WITH vec AS (
      SELECT id,
             ROW_NUMBER() OVER (ORDER BY embedding <=> ${vecLiteral}::vector) AS rank
      FROM chunks
      WHERE workspace_id = ${workspaceId}
      ORDER BY embedding <=> ${vecLiteral}::vector
      LIMIT ${vectorTop}
    ),
    fts AS (
      SELECT id,
             ROW_NUMBER() OVER (
               ORDER BY ts_rank(tsv, plainto_tsquery('simple', ${query})) DESC
             ) AS rank
      FROM chunks
      WHERE workspace_id = ${workspaceId}
        AND tsv @@ plainto_tsquery('simple', ${query})
      LIMIT ${ftsTop}
    ),
    merged AS (
      SELECT id, rank FROM vec
      UNION ALL
      SELECT id, rank FROM fts
    )
    SELECT c.id, c.content, c.metadata,
           SUM(1.0 / (${rrfK} + m.rank))::float AS score
    FROM merged m
    JOIN chunks c ON c.id = m.id
    GROUP BY c.id, c.content, c.metadata
    ORDER BY score DESC
    LIMIT ${finalTop};
  `);

  const results = (rows as unknown as Array<{
    id: string;
    content: string;
    metadata: RetrievedChunk["metadata"];
    score: string | number;
  }>).map((r) => ({
    id: r.id,
    content: r.content,
    metadata: r.metadata,
    score: typeof r.score === "string" ? parseFloat(r.score) : r.score,
  }));

  return results.filter((r) => r.score >= minScore);
}
