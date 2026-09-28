CREATE TYPE "public"."fief_event_kind" AS ENUM('upgrade_finished', 'art_learned', 'upgrade_cancelled', 'study_cancelled');--> statement-breakpoint
CREATE TABLE "fief_events" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "fief_events_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"fief_id" uuid NOT NULL,
	"kind" "fief_event_kind" NOT NULL,
	"building" "building",
	"art" "art",
	"level" integer NOT NULL,
	"refund_wood" double precision DEFAULT 0 NOT NULL,
	"refund_stone" double precision DEFAULT 0 NOT NULL,
	"refund_iron" double precision DEFAULT 0 NOT NULL,
	"refund_gold" double precision DEFAULT 0 NOT NULL,
	"refund_food" double precision DEFAULT 0 NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	CONSTRAINT "fief_events_building_or_art" CHECK (("fief_events"."building" IS NULL) <> ("fief_events"."art" IS NULL))
);
--> statement-breakpoint
ALTER TABLE "fief_events" ADD CONSTRAINT "fief_events_fief_id_fiefs_id_fk" FOREIGN KEY ("fief_id") REFERENCES "public"."fiefs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "fief_events_fief_order" ON "fief_events" USING btree ("fief_id","occurred_at","id");