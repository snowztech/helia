ALTER TABLE "workspaces" ALTER COLUMN "token_quota_monthly" SET DEFAULT 100000;--> statement-breakpoint
ALTER TABLE "workspaces" ADD COLUMN "plan" text DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE "workspaces" ADD COLUMN "billing_status" text DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE "workspaces" ADD COLUMN "stripe_customer_id" text;--> statement-breakpoint
ALTER TABLE "workspaces" ADD COLUMN "stripe_subscription_id" text;--> statement-breakpoint
ALTER TABLE "workspaces" ADD COLUMN "stripe_price_id" text;--> statement-breakpoint
ALTER TABLE "workspaces" ADD COLUMN "current_period_end" timestamp with time zone;