import { sql } from "drizzle-orm";
import {
  boolean,
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
  // Branding rendered by the widget. Owner-editable from the admin.
  brandPrimary: text("brand_primary").default("#0ea5e9").notNull(),
  botName: text("bot_name").default("Assistant").notNull(),
  botSubtitle: text("bot_subtitle")
    .default("Ask me anything.")
    .notNull(),
  botGreeting: text("bot_greeting")
    .default("Hi, how can I help?")
    .notNull(),
  botPlaceholder: text("bot_placeholder")
    .default("Ask a question...")
    .notNull(),
  widgetPosition: text("widget_position", {
    enum: ["bottom-right", "bottom-left"],
  })
    .default("bottom-right")
    .notNull(),
  widgetTheme: text("widget_theme", { enum: ["light", "dark", "auto"] })
    .default("auto")
    .notNull(),
  widgetRadius: integer("widget_radius").default(14).notNull(),
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

/**
 * HTTP tools the agent can call mid-conversation. Each row maps an
 * external endpoint to a callable tool the LLM sees in its prompt.
 *
 *  - `name` becomes the tool name surfaced to the model.
 *  - `params_schema` describes parameters the LLM fills in.
 *  - `headers` are extra outbound headers (e.g. a static API key the
 *     customer issued for us). Stored encrypted in v1.5 — plaintext for now.
 *
 * Per-end-user identity ("coach_id from JWT") lands in a later milestone.
 * The `source` field on parameters is forward-looking: "llm" (visible to
 * the model) vs "context" (server-injected from a verified JWT). Only
 * "llm" is honoured in MVP.
 */
export type ToolParam = {
  name: string;
  type: "string" | "number" | "boolean";
  description: string;
  required: boolean;
  source: "llm" | "context";
  contextPath?: string;
};

export const tools = pgTable(
  "tools",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .references(() => workspaces.id, { onDelete: "cascade" })
      .notNull(),
    // Snake_case identifier the LLM sees: get_orders, lookup_member, etc.
    name: text("name").notNull(),
    description: text("description").notNull(),
    url: text("url").notNull(),
    method: text("method", { enum: ["GET", "POST"] })
      .default("POST")
      .notNull(),
    paramsSchema: jsonb("params_schema")
      .$type<ToolParam[]>()
      .default(sql`'[]'::jsonb`)
      .notNull(),
    headers: jsonb("headers")
      .$type<Record<string, string>>()
      .default(sql`'{}'::jsonb`)
      .notNull(),
    timeoutMs: integer("timeout_ms").default(10000).notNull(),
    maxResponseBytes: integer("max_response_bytes").default(102400).notNull(),
    enabled: boolean("enabled").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    byWorkspace: index("tools_workspace_idx").on(t.workspaceId),
  }),
);

export type Workspace = typeof workspaces.$inferSelect;
export type Source = typeof sources.$inferSelect;
export type NewSource = typeof sources.$inferInsert;
export type Chunk = typeof chunks.$inferSelect;
export type NewChunk = typeof chunks.$inferInsert;
export type SourceEvent = typeof sourceEvents.$inferSelect;
export type NewSourceEvent = typeof sourceEvents.$inferInsert;
export type Tool = typeof tools.$inferSelect;
export type NewTool = typeof tools.$inferInsert;
