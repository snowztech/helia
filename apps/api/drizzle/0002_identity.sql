ALTER TABLE "chat_traces" ADD COLUMN "user_id" text;--> statement-breakpoint
ALTER TABLE "chat_traces" ADD COLUMN "user_name" text;--> statement-breakpoint
ALTER TABLE "workspaces" ADD COLUMN "identity_secret" text;--> statement-breakpoint
ALTER TABLE "workspaces" ADD COLUMN "identity_required" boolean DEFAULT false NOT NULL;