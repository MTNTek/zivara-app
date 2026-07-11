DO $$ BEGIN
 CREATE TYPE "public"."email_token_type" AS ENUM('email_verification', 'password_reset');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "email_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" varchar NOT NULL,
	"type" "email_token_type" NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "login_attempts" smallint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "lockout_until" timestamp with time zone;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "email_tokens" ADD CONSTRAINT "email_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_email_tokens_token_hash" ON "email_tokens" ("token_hash");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_email_tokens_user_id" ON "email_tokens" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_email_tokens_type_used" ON "email_tokens" ("type","used_at");