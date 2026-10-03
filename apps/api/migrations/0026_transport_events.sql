ALTER TYPE "public"."fief_event_kind" ADD VALUE 'transport_sent';--> statement-breakpoint
ALTER TYPE "public"."fief_event_kind" ADD VALUE 'transport_arrived';--> statement-breakpoint
ALTER TABLE "fief_events" DROP CONSTRAINT "fief_events_founding_name";--> statement-breakpoint
ALTER TABLE "fief_events" ADD CONSTRAINT "fief_events_founding_name" CHECK (("fief_events"."fief_name" IS NOT NULL) = ("fief_events"."kind"::text IN ('founding_sent', 'fief_founded', 'transport_sent', 'transport_arrived')));