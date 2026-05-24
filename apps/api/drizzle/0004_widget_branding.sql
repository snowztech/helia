ALTER TABLE "workspaces" ADD COLUMN "bot_avatar" text;--> statement-breakpoint
ALTER TABLE "workspaces" ADD COLUMN "launcher_icon" text DEFAULT 'sparkles' NOT NULL;