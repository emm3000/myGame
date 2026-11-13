CREATE TYPE "public"."scaffold" AS ENUM('es', 'none');--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "scaffold" "scaffold" DEFAULT 'es' NOT NULL;--> statement-breakpoint
ALTER TABLE "players" ALTER COLUMN "scaffold" DROP DEFAULT;
