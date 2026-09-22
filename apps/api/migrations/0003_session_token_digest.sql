ALTER TABLE "sessions" RENAME COLUMN "token" TO "token_digest";--> statement-breakpoint
UPDATE "sessions" SET "token_digest" = encode(sha256(convert_to("token_digest", 'UTF8')), 'hex');--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_token_digest_hex" CHECK ("sessions"."token_digest" ~ '^[0-9a-f]{64}$');