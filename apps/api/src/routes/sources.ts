import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { desc, eq, asc } from "drizzle-orm";
import { z } from "zod";
import { sourceEvents, sources } from "@helia/db";
import { runIngestPdf, runIngestText, runIngestUrl } from "@helia/rag";
import { db, log } from "../lib/state";
import { currentWorkspace } from "../lib/auth";

export const sourcesRouter = new Hono();

// ─── list ────────────────────────────────────────────────────────────────

sourcesRouter.get("/", async (c) => {
  const ws = currentWorkspace(c).id;
  const rows = await db
    .select()
    .from(sources)
    .where(eq(sources.workspaceId, ws))
    .orderBy(desc(sources.createdAt))
    .limit(50);
  return c.json({ sources: rows });
});

// ─── detail ──────────────────────────────────────────────────────────────

sourcesRouter.get("/:id", async (c) => {
  const id = c.req.param("id");
  const [row] = await db.select().from(sources).where(eq(sources.id, id)).limit(1);
  if (!row) return c.json({ error: "not found" }, 404);
  return c.json({ source: row });
});

sourcesRouter.get("/:id/events", async (c) => {
  const id = c.req.param("id");
  const events = await db
    .select()
    .from(sourceEvents)
    .where(eq(sourceEvents.sourceId, id))
    .orderBy(asc(sourceEvents.createdAt))
    .limit(200);
  return c.json({ events });
});

// ─── delete ──────────────────────────────────────────────────────────────

sourcesRouter.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const res = await db.delete(sources).where(eq(sources.id, id)).returning();
  if (res.length === 0) return c.json({ error: "not found" }, 404);
  return c.json({ ok: true });
});

// ─── create: PDF (multipart) ─────────────────────────────────────────────

sourcesRouter.post("/pdf", async (c) => {
  const form = await c.req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return c.json({ error: "file required" }, 400);
  if (file.size === 0) return c.json({ error: "empty file" }, 400);
  if (file.size > 50 * 1024 * 1024)
    return c.json({ error: "file too large (max 50 MB)" }, 400);

  const workspaceId = currentWorkspace(c).id;
  const [source] = await db
    .insert(sources)
    .values({ workspaceId, name: file.name, type: "pdf", status: "queued" })
    .returning();
  if (!source) return c.json({ error: "failed to create source" }, 500);

  const buffer = Buffer.from(await file.arrayBuffer());
  try {
    await runIngestPdf({ db, workspaceId, sourceId: source.id }, buffer);
    return c.json({ source: { ...source, status: "ready" } });
  } catch (err) {
    log.error({ err, sourceId: source.id }, "PDF ingest failed");
    return c.json({ source, error: String(err) }, 200);
  }
});

// ─── create: plain text ──────────────────────────────────────────────────

const TextBody = z.object({
  name: z.string().trim().min(1),
  text: z.string().trim().min(20),
});

sourcesRouter.post("/text", zValidator("json", TextBody), async (c) => {
  const { name, text } = c.req.valid("json");
  const workspaceId = currentWorkspace(c).id;
  const [source] = await db
    .insert(sources)
    .values({ workspaceId, name, type: "text", status: "queued" })
    .returning();
  if (!source) return c.json({ error: "failed to create source" }, 500);

  try {
    await runIngestText({ db, workspaceId, sourceId: source.id }, text);
    return c.json({ source: { ...source, status: "ready" } });
  } catch (err) {
    log.error({ err, sourceId: source.id }, "text ingest failed");
    return c.json({ source, error: String(err) }, 200);
  }
});

// ─── create: URL crawl (async) ───────────────────────────────────────────

const UrlBody = z.object({
  url: z.string().url(),
  maxPages: z.number().int().min(1).max(200).optional(),
  maxDepth: z.number().int().min(0).max(5).optional(),
});

sourcesRouter.post("/url", zValidator("json", UrlBody), async (c) => {
  const { url, maxPages, maxDepth } = c.req.valid("json");
  const parsed = new URL(url);
  if (!/^https?:$/.test(parsed.protocol)) {
    return c.json({ error: "only http(s) URLs supported" }, 400);
  }

  const workspaceId = currentWorkspace(c).id;
  const [source] = await db
    .insert(sources)
    .values({
      workspaceId,
      name: parsed.host,
      type: "url",
      status: "queued",
      config: { seedUrl: parsed.toString(), maxPages: maxPages ?? 50 },
    })
    .returning();
  if (!source) return c.json({ error: "failed to create source" }, 500);

  // Fire-and-forget in-process. runIngestUrl handles its own state + events,
  // and marks the source failed on error. The client polls /sources/:id.
  void runIngestUrl(
    { db, workspaceId, sourceId: source.id },
    parsed.toString(),
    { maxPages: maxPages ?? 50, maxDepth: maxDepth ?? 3 },
  ).catch((err) => log.error({ err, sourceId: source.id }, "URL ingest failed"));

  return c.json({ source }, 202);
});
