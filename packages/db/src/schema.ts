import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  vector,
} from "drizzle-orm/pg-core";

/**
 * Embedding dimensions = OpenAI text-embedding-3-small (1536).
 * Switching providers requires re-indexing all chunks.
 */
export const EMBEDDING_DIMENSIONS = 1536;

export const workspaces = pgTable("workspaces", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  // BCP-47 locale (en, fr, ...). Used in the agent system prompt.
  // FTS uses 'simple' config (language-agnostic) for now.
  locale: text("locale").default("en").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const sources = pgTable(
  "sources",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .references(() => workspaces.id, { onDelete: "cascade" })
      .notNull(),
    name: text("name").notNull(),
    type: text("type", { enum: ["pdf", "text", "url"] }).notNull(),
    // queued → processing → ready | failed
    status: text("status", { enum: ["queued", "processing", "ready", "failed"] })
      .default("queued")
      .notNull(),
    progress: integer("progress").default(0).notNull(), // 0..100
    error: text("error"),
    // Type-specific config (e.g., URL crawl settings) and stats (page count, etc.)
    config: jsonb("config").$type<Record<string, unknown>>(),
    stats: jsonb("stats").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    byWorkspace: index("sources_workspace_idx").on(t.workspaceId),
    byStatus: index("sources_status_idx").on(t.status),
  }),
);

export const chunks = pgTable(
  "chunks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .references(() => workspaces.id, { onDelete: "cascade" })
      .notNull(),
    sourceId: uuid("source_id")
      .references(() => sources.id, { onDelete: "cascade" })
      .notNull(),
    content: text("content").notNull(),
    tokens: integer("tokens").notNull(),
    metadata: jsonb("metadata").$type<{
      docTitle?: string;
      section?: string;
      page?: number;
      url?: string;
    }>(),
    embedding: vector("embedding", { dimensions: EMBEDDING_DIMENSIONS }).notNull(),
    // The `tsv` tsvector generated column is added by the bootstrap script
    // (apps/web/scripts/db-init.ts). Drizzle ne supporte pas GENERATED tsvector.
    tsv: text("tsv"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    byWorkspaceSource: index("chunks_ws_source_idx").on(t.workspaceId, t.sourceId),
    hnsw: index("chunks_embedding_hnsw_idx").using(
      "hnsw",
      t.embedding.op("vector_cosine_ops"),
    ),
  }),
);

/**
 * Append-only event log per source. The worker writes events at each step
 * (started, page crawled, batch embedded, ready, failed) so the UI can show
 * a real timeline instead of just the current status.
 */
export const sourceEvents = pgTable(
  "source_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sourceId: uuid("source_id")
      .references(() => sources.id, { onDelete: "cascade" })
      .notNull(),
    level: text("level", { enum: ["info", "warn", "error"] })
      .default("info")
      .notNull(),
    message: text("message").notNull(),
    data: jsonb("data").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    bySource: index("source_events_source_idx").on(t.sourceId, t.createdAt),
  }),
);

export type Workspace = typeof workspaces.$inferSelect;
export type Source = typeof sources.$inferSelect;
export type NewSource = typeof sources.$inferInsert;
export type Chunk = typeof chunks.$inferSelect;
export type NewChunk = typeof chunks.$inferInsert;
export type SourceEvent = typeof sourceEvents.$inferSelect;
export type NewSourceEvent = typeof sourceEvents.$inferInsert;
