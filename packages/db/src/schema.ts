import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
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
  // LLM model the agent uses. Provider is implied (OpenAI only for now).
  model: text("model").default("gpt-4o-mini").notNull(),
  // Branding rendered by the widget. Owner-editable from the admin.
  brandPrimary: text("brand_primary").default("#3a55e0").notNull(),
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
  // Either a URL (rendered as <img>) or a short string (rendered as text:
  // initial letter or emoji). Null falls back to the Helia mark.
  botAvatar: text("bot_avatar"),
  botSuggestions: jsonb("bot_suggestions")
    .$type<string[]>()
    .default(sql`'[]'::jsonb`)
    .notNull(),
  // HMAC secret for identifying end-users. Stored as the output of
  // crypto.encrypt() (AES-256-GCM with MASTER_KEY). Null until the customer
  // generates one from /settings. The plaintext is shown to the customer
  // exactly once on rotate, never persisted clear.
  identitySecret: text("identity_secret"),
  // When true, /v1/chat rejects unsigned requests with 401. Customers turn
  // this on once their widget is sending signed identities reliably.
  identityRequired: boolean("identity_required").default(false).notNull(),
  // Soft cap to prevent runaway costs. Reached → /v1/chat returns 402.
  // Counts against the sum of chat_traces.totalTokens since the 1st of the
  // current month. Owners raise it from /settings.
  tokenQuotaMonthly: integer("token_quota_monthly")
    .default(1_000_000)
    .notNull(),
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
    // Drizzle's DSL can't model GENERATED tsvector. The migration creates
    // the real column (`tsvector GENERATED ALWAYS AS to_tsvector(content)`);
    // we declare it as text here so queries that select it still typecheck.
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

/**
 * One row per chat turn. Captures what the user asked, what the agent
 * answered, which tools fired, how long it took, and what it cost.
 *
 * Powers the admin dashboard (counts, avg latency, recent conversations)
 * and — later — a per-turn debug view.
 */
export const chatTraces = pgTable(
  "chat_traces",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .references(() => workspaces.id, { onDelete: "cascade" })
      .notNull(),
    // Groups consecutive turns from the same widget session. The widget
    // generates a random id in sessionStorage on mount. Nullable so direct
    // /v1/chat calls (e.g. admin preview) still record cleanly.
    conversationId: uuid("conversation_id"),
    // Verified end-user identity (HMAC-signed by the customer's backend).
    // Null when the workspace runs in anonymous mode.
    userId: text("user_id"),
    userName: text("user_name"),
    userMessage: text("user_message").notNull(),
    finalAnswer: text("final_answer"),
    totalTokens: integer("total_tokens").default(0).notNull(),
    totalLatencyMs: integer("total_latency_ms").default(0).notNull(),
    model: text("model").notNull(),
    // Tool / LLM steps from the AI SDK. Stored raw for the future detail view.
    steps: jsonb("steps")
      .$type<unknown[]>()
      .default(sql`'[]'::jsonb`)
      .notNull(),
    // Source titles + scores returned by search_knowledge, if any.
    retrieval: jsonb("retrieval")
      .$type<
        Array<{ title: string; url: string | null; score: number }>
      >()
      .default(sql`'[]'::jsonb`)
      .notNull(),
    error: text("error"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    byWorkspaceTime: index("chat_traces_ws_time_idx").on(
      t.workspaceId,
      t.createdAt,
    ),
  }),
);

export type ChatTrace = typeof chatTraces.$inferSelect;
export type NewChatTrace = typeof chatTraces.$inferInsert;

/**
 * End-users the workspace owner has banned from the widget. Identified
 * users only (anonymous traffic is governed by rate limits, not bans).
 * Banned users still see the widget; the agent replies with a canned
 * message and we don't invoke the LLM.
 */
export const bannedUsers = pgTable(
  "banned_users",
  {
    workspaceId: uuid("workspace_id")
      .references(() => workspaces.id, { onDelete: "cascade" })
      .notNull(),
    // `chat_traces.user_id` is text (whatever the customer signs with),
    // so this matches that shape.
    userId: text("user_id").notNull(),
    reason: text("reason"),
    bannedAt: timestamp("banned_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    // Workspace member who issued the ban. Nullable so the row survives
    // if that admin later deletes their account.
    bannedBy: uuid("banned_by").references(() => users.id, {
      onDelete: "set null",
    }),
  },
  (t) => ({
    pk: uniqueIndex("banned_users_unique").on(t.workspaceId, t.userId),
  }),
);

export type BannedUser = typeof bannedUsers.$inferSelect;
export type NewBannedUser = typeof bannedUsers.$inferInsert;

/**
 * Owner / member accounts. One row per real human. Email is the only
 * unique identifier we know about a user.
 */
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  // bcrypt hash. Null only briefly between signup and first password set.
  passwordHash: text("password_hash"),
  name: text("name"),
  emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/**
 * Who belongs to which workspace, with what role. A user can belong to
 * multiple workspaces (post-v1, when team invites land). For v1 it's
 * 1:1 — every signup creates a workspace and adds the user as owner.
 */
export const workspaceMembers = pgTable(
  "workspace_members",
  {
    workspaceId: uuid("workspace_id")
      .references(() => workspaces.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    role: text("role", { enum: ["owner", "admin", "member"] })
      .default("owner")
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    pk: index("workspace_members_pk").on(t.workspaceId, t.userId),
    byUser: index("workspace_members_user_idx").on(t.userId),
  }),
);

/**
 * Server-side sessions. The cookie holds only the id; everything else
 * (user, expiry) lives here. Easy to revoke (`DELETE WHERE id = ?`).
 */
export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/**
 * One-time tokens for email verification (signup confirmation) and, later,
 * password reset. The `purpose` field separates the two — same plumbing.
 */
export const emailTokens = pgTable("email_tokens", {
  token: text("token").primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  purpose: text("purpose", { enum: ["verify_email", "reset_password"] })
    .notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type Workspace = typeof workspaces.$inferSelect;
export type Source = typeof sources.$inferSelect;
export type NewSource = typeof sources.$inferInsert;
export type Chunk = typeof chunks.$inferSelect;
export type NewChunk = typeof chunks.$inferInsert;
export type SourceEvent = typeof sourceEvents.$inferSelect;
export type NewSourceEvent = typeof sourceEvents.$inferInsert;
export type Tool = typeof tools.$inferSelect;
export type NewTool = typeof tools.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type WorkspaceMember = typeof workspaceMembers.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type EmailToken = typeof emailTokens.$inferSelect;
export type NewEmailToken = typeof emailTokens.$inferInsert;
