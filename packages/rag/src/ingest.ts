import { eq } from "drizzle-orm";
import { chunks, sourceEvents, sources, type Db } from "@helia/db";
import { chunkText, type Chunk } from "./chunk";
import { embedTexts } from "./embed";
import { extractPdf, extractPlainText, type ExtractedDoc } from "./extract";
import { crawlSite, type CrawlOptions } from "./crawl";

/**
 * Ingest orchestrators. Called from web server actions (no separate worker).
 *
 * Each function:
 *  1. Marks the source as "processing".
 *  2. Writes a timeline of events to `source_events` so the UI can show
 *     a real log.
 *  3. Extracts → chunks → embeds → stores chunks.
 *  4. Marks ready / failed.
 *
 * Idempotent at source level: re-runs clear existing chunks first.
 */

export type IngestContext = {
  db: Db;
  workspaceId: string;
  sourceId: string;
};

// ─── public orchestrators ────────────────────────────────────────────────

export async function runIngestPdf(ctx: IngestContext, buffer: Buffer): Promise<void> {
  try {
    await markProcessing(ctx);
    await logEvent(ctx, "info", `PDF received (${(buffer.length / 1024).toFixed(1)} kB)`);
    await clearExistingChunks(ctx);

    const doc = await extractPdf(buffer);
    await logEvent(ctx, "info", `Extracted ${doc.text.length} chars / ${doc.meta.pageCount ?? "?"} pages`);

    await persistDoc(ctx, doc, doc.meta.title ?? "PDF");
    await markReady(ctx, {
      pageCount: doc.meta.pageCount,
      contentChars: doc.text.length,
    });
  } catch (err) {
    await fail(ctx, err);
    throw err;
  }
}

export async function runIngestText(ctx: IngestContext, text: string): Promise<void> {
  try {
    await markProcessing(ctx);
    await logEvent(ctx, "info", `Text received (${text.length} chars)`);
    await clearExistingChunks(ctx);

    const doc = extractPlainText(text);
    await persistDoc(ctx, doc, "text");
    await markReady(ctx, { contentChars: doc.text.length });
  } catch (err) {
    await fail(ctx, err);
    throw err;
  }
}

export async function runIngestUrl(
  ctx: IngestContext,
  seedUrl: string,
  crawlOpts?: CrawlOptions,
): Promise<void> {
  try {
    await markProcessing(ctx);
    await logEvent(ctx, "info", `Starting crawl from ${seedUrl}`);
    await clearExistingChunks(ctx);

    let crawled = 0;
    const pages = await crawlSite(seedUrl, {
      ...crawlOpts,
      onPage: async (p) => {
        crawled++;
        if (crawled % 5 === 1) {
          await logEvent(ctx, "info", `Crawled ${crawled} pages — latest: ${p.url}`);
        }
      },
    });

    await logEvent(ctx, "info", `Crawl done — ${pages.length} pages`);

    if (pages.length === 0) {
      throw new Error("Crawler returned 0 pages (robots.txt blocking, network error, or empty site)");
    }

    const total = pages.length;
    for (let i = 0; i < pages.length; i++) {
      const p = pages[i]!;
      const pieces = chunkText(p.text);
      const docTitle = p.title ?? p.url;
      const enriched = pieces.map((piece) => ({
        ...piece,
        headerForEmbed: `[${docTitle}]\n${piece.content}`,
      }));
      await storeChunks(ctx, enriched, { docTitle, url: p.url });

      const pct = Math.round(((i + 1) / total) * 95);
      await ctx.db
        .update(sources)
        .set({ progress: pct, updatedAt: new Date() })
        .where(eq(sources.id, ctx.sourceId));

      if (i % 5 === 4 || i === pages.length - 1) {
        await logEvent(ctx, "info", `Embedded ${i + 1}/${pages.length} pages`);
      }
    }

    await markReady(ctx, { pageCount: pages.length });
  } catch (err) {
    await fail(ctx, err);
    throw err;
  }
}

// ─── helpers ─────────────────────────────────────────────────────────────

type EnrichedChunk = Chunk & { headerForEmbed: string };

async function persistDoc(
  ctx: IngestContext,
  doc: ExtractedDoc,
  docTitle: string,
): Promise<void> {
  const pieces = chunkText(doc.text);
  if (pieces.length === 0) throw new Error("Extraction produced no content");
  await logEvent(ctx, "info", `Chunked into ${pieces.length} pieces`);

  const enriched: EnrichedChunk[] = pieces.map((p) => ({
    ...p,
    headerForEmbed: `[${docTitle}]\n${p.content}`,
  }));

  await storeChunks(ctx, enriched, {
    docTitle,
    page: doc.meta.pageCount,
    url: doc.meta.url,
  });
  await logEvent(ctx, "info", `Embedded ${pieces.length} chunks`);
}

async function storeChunks(
  ctx: IngestContext,
  pieces: EnrichedChunk[],
  meta: { docTitle: string; section?: string; page?: number; url?: string },
): Promise<void> {
  if (pieces.length === 0) return;
  const texts = pieces.map((p) => p.headerForEmbed);
  const vectors = await embedTexts(texts);
  if (vectors.length !== pieces.length) {
    throw new Error("Embedding count mismatch");
  }
  await ctx.db.insert(chunks).values(
    pieces.map((p, i) => ({
      workspaceId: ctx.workspaceId,
      sourceId: ctx.sourceId,
      content: p.content,
      tokens: p.tokens,
      metadata: meta,
      embedding: vectors[i]!,
    })),
  );
}

async function clearExistingChunks(ctx: IngestContext): Promise<void> {
  await ctx.db.delete(chunks).where(eq(chunks.sourceId, ctx.sourceId));
}

async function markProcessing(ctx: IngestContext): Promise<void> {
  await ctx.db
    .update(sources)
    .set({ status: "processing", progress: 0, error: null, updatedAt: new Date() })
    .where(eq(sources.id, ctx.sourceId));
}

async function markReady(
  ctx: IngestContext,
  stats: Record<string, unknown>,
): Promise<void> {
  await ctx.db
    .update(sources)
    .set({ status: "ready", progress: 100, stats, updatedAt: new Date() })
    .where(eq(sources.id, ctx.sourceId));
  await logEvent(ctx, "info", "Ready");
}

async function fail(ctx: IngestContext, err: unknown): Promise<void> {
  const msg = errorMessage(err);
  await ctx.db
    .update(sources)
    .set({ status: "failed", error: msg, updatedAt: new Date() })
    .where(eq(sources.id, ctx.sourceId));
  await logEvent(ctx, "error", `Failed: ${msg}`);
}

async function logEvent(
  ctx: IngestContext,
  level: "info" | "warn" | "error",
  message: string,
  data?: Record<string, unknown>,
): Promise<void> {
  await ctx.db.insert(sourceEvents).values({
    sourceId: ctx.sourceId,
    level,
    message,
    data: data ?? null,
  });
}

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}
