ALTER TABLE "fief_events" ADD COLUMN "recalled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "fief_marches" ADD COLUMN "recalled_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "fief_events" ADD CONSTRAINT "fief_events_recalled_only_march" CHECK (NOT "fief_events"."recalled" OR "fief_events"."kind"::text = 'march_returned');--> statement-breakpoint
ALTER TABLE "fief_marches" ADD CONSTRAINT "fief_marches_recalled_after_departure" CHECK ("fief_marches"."recalled_at" IS NULL OR "fief_marches"."recalled_at" >= "fief_marches"."departed_at");