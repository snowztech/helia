CREATE TABLE "banned_users" (
	"workspace_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"reason" text,
	"banned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"banned_by" uuid
);
--> statement-breakpoint
ALTER TABLE "banned_users" ADD CONSTRAINT "banned_users_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "banned_users" ADD CONSTRAINT "banned_users_banned_by_users_id_fk" FOREIGN KEY ("banned_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "banned_users_unique" ON "banned_users" USING btree ("workspace_id","user_id");