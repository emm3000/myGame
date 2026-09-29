ALTER TYPE "public"."fief_event_kind" ADD VALUE 'march_returned';--> statement-breakpoint
CREATE TABLE "fief_marches" (
	"fief_id" uuid PRIMARY KEY NOT NULL,
	"province" integer NOT NULL,
	"plot" integer NOT NULL,
	"infantry" integer NOT NULL,
	"stay_hours" integer NOT NULL,
	"one_way_seconds" integer NOT NULL,
	"departed_at" timestamp with time zone NOT NULL,
	"loot_wood" double precision NOT NULL,
	"loot_stone" double precision NOT NULL,
	"loot_iron" double precision NOT NULL,
	"loot_gold" double precision NOT NULL,
	"loot_food" double precision NOT NULL,
	CONSTRAINT "fief_marches_province_positive" CHECK ("fief_marches"."province" >= 1),
	CONSTRAINT "fief_marches_plot_positive" CHECK ("fief_marches"."plot" >= 1),
	CONSTRAINT "fief_marches_infantry_positive" CHECK ("fief_marches"."infantry" >= 1),
	CONSTRAINT "fief_marches_stay_hours_positive" CHECK ("fief_marches"."stay_hours" >= 1),
	CONSTRAINT "fief_marches_one_way_seconds_positive" CHECK ("fief_marches"."one_way_seconds" >= 1),
	CONSTRAINT "fief_marches_loot_wood_whole" CHECK ("fief_marches"."loot_wood" >= 0 AND "fief_marches"."loot_wood" = trunc("fief_marches"."loot_wood")),
	CONSTRAINT "fief_marches_loot_stone_whole" CHECK ("fief_marches"."loot_stone" >= 0 AND "fief_marches"."loot_stone" = trunc("fief_marches"."loot_stone")),
	CONSTRAINT "fief_marches_loot_iron_whole" CHECK ("fief_marches"."loot_iron" >= 0 AND "fief_marches"."loot_iron" = trunc("fief_marches"."loot_iron")),
	CONSTRAINT "fief_marches_loot_gold_whole" CHECK ("fief_marches"."loot_gold" >= 0 AND "fief_marches"."loot_gold" = trunc("fief_marches"."loot_gold")),
	CONSTRAINT "fief_marches_loot_food_whole" CHECK ("fief_marches"."loot_food" >= 0 AND "fief_marches"."loot_food" = trunc("fief_marches"."loot_food"))
);
--> statement-breakpoint
ALTER TABLE "fief_events" DROP CONSTRAINT "fief_events_one_subject";--> statement-breakpoint
ALTER TABLE "fief_events" ADD COLUMN "province" integer;--> statement-breakpoint
ALTER TABLE "fief_events" ADD COLUMN "plot" integer;--> statement-breakpoint
ALTER TABLE "fief_marches" ADD CONSTRAINT "fief_marches_fief_id_fiefs_id_fk" FOREIGN KEY ("fief_id") REFERENCES "public"."fiefs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fief_events" ADD CONSTRAINT "fief_events_one_subject" CHECK (num_nonnulls("fief_events"."building", "fief_events"."art", "fief_events"."unit") = 1 AND ("fief_events"."level" IS NULL) = ("fief_events"."unit" IS NOT NULL) AND ("fief_events"."count" IS NULL) = ("fief_events"."unit" IS NULL) AND ("fief_events"."cancelled_count" IS NULL OR ("fief_events"."unit" IS NOT NULL AND "fief_events"."cancelled_count" >= 1)) AND ("fief_events"."province" IS NULL) = ("fief_events"."plot" IS NULL) AND ("fief_events"."province" IS NULL OR ("fief_events"."unit" IS NOT NULL AND "fief_events"."province" >= 1 AND "fief_events"."plot" >= 1)));