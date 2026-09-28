CREATE TYPE "public"."account_token_kind" AS ENUM('reset', 'verify');--> statement-breakpoint
CREATE TABLE "account_tokens" (
	"token_digest" text PRIMARY KEY NOT NULL,
	"player_id" uuid NOT NULL,
	"kind" "account_token_kind" NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	CONSTRAINT "account_tokens_token_digest_hex" CHECK ("account_tokens"."token_digest" ~ '^[0-9a-f]{64}$')
);
--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "email_verified_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "account_tokens" ADD CONSTRAINT "account_tokens_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;