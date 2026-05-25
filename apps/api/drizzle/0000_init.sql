CREATE TABLE "banned_users" (
	"workspace_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"reason" text,
	"banned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"banned_by" uuid
);
--> statement-breakpoint
CREATE TABLE "chat_traces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"conversation_id" uuid,
	"user_id" text,
	"user_name" text,
	"user_message" text NOT NULL,
	"final_answer" text,
	"total_tokens" integer DEFAULT 0 NOT NULL,
	"total_latency_ms" integer DEFAULT 0 NOT NULL,
	"model" text NOT NULL,
	"steps" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"retrieval" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chunks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"source_id" uuid NOT NULL,
	"content" text NOT NULL,
	"tokens" integer NOT NULL,
	"metadata" jsonb,
	"embedding" vector(1536) NOT NULL,
	"tsv" tsvector GENERATED ALWAYS AS (to_tsvector('simple', coalesce(content, ''))) STORED,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_tokens" (
	"token" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"purpose" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "source_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_id" uuid NOT NULL,
	"level" text DEFAULT 'info' NOT NULL,
	"message" text NOT NULL,
	"data" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"error" text,
	"config" jsonb,
	"stats" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tools" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"url" text NOT NULL,
	"method" text DEFAULT 'POST' NOT NULL,
	"params_schema" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"headers" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"timeout_ms" integer DEFAULT 10000 NOT NULL,
	"max_response_bytes" integer DEFAULT 102400 NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text,
	"name" text,
	"email_verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "workspace_members" (
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" text DEFAULT 'owner' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"locale" text DEFAULT 'en' NOT NULL,
	"model" text DEFAULT 'gpt-4o-mini' NOT NULL,
	"brand_primary" text DEFAULT '#3a55e0' NOT NULL,
	"bot_name" text DEFAULT 'Assistant' NOT NULL,
	"bot_subtitle" text DEFAULT 'Ask me anything.' NOT NULL,
	"bot_greeting" text DEFAULT 'Hi, how can I help?' NOT NULL,
	"bot_placeholder" text DEFAULT 'Ask a question...' NOT NULL,
	"widget_position" text DEFAULT 'bottom-right' NOT NULL,
	"widget_theme" text DEFAULT 'auto' NOT NULL,
	"widget_radius" integer DEFAULT 14 NOT NULL,
	"bot_avatar" text,
	"bot_suggestions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"identity_secret" text,
	"identity_required" boolean DEFAULT false NOT NULL,
	"token_quota_monthly" integer DEFAULT 1000000 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "banned_users" ADD CONSTRAINT "banned_users_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "banned_users" ADD CONSTRAINT "banned_users_banned_by_users_id_fk" FOREIGN KEY ("banned_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_traces" ADD CONSTRAINT "chat_traces_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chunks" ADD CONSTRAINT "chunks_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chunks" ADD CONSTRAINT "chunks_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_tokens" ADD CONSTRAINT "email_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_events" ADD CONSTRAINT "source_events_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sources" ADD CONSTRAINT "sources_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tools" ADD CONSTRAINT "tools_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "banned_users_unique" ON "banned_users" USING btree ("workspace_id","user_id");--> statement-breakpoint
CREATE INDEX "chat_traces_ws_time_idx" ON "chat_traces" USING btree ("workspace_id","created_at");--> statement-breakpoint
CREATE INDEX "chunks_ws_source_idx" ON "chunks" USING btree ("workspace_id","source_id");--> statement-breakpoint
CREATE INDEX "chunks_embedding_hnsw_idx" ON "chunks" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "chunks_tsv_idx" ON "chunks" USING GIN ("tsv");--> statement-breakpoint
CREATE INDEX "source_events_source_idx" ON "source_events" USING btree ("source_id","created_at");--> statement-breakpoint
CREATE INDEX "sources_workspace_idx" ON "sources" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "sources_status_idx" ON "sources" USING btree ("status");--> statement-breakpoint
CREATE INDEX "tools_workspace_idx" ON "tools" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "workspace_members_pk" ON "workspace_members" USING btree ("workspace_id","user_id");--> statement-breakpoint
CREATE INDEX "workspace_members_user_idx" ON "workspace_members" USING btree ("user_id");