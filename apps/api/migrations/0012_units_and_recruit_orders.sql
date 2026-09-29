CREATE TYPE "public"."unit" AS ENUM('infantry');--> statement-breakpoint
ALTER TYPE "public"."fief_event_kind" ADD VALUE 'recruits_delivered';--> statement-breakpoint
CREATE TABLE "fief_recruit_orders" (
	"fief_id" uuid PRIMARY KEY NOT NULL,
	"kind" "unit" NOT NULL,
	"count" integer NOT NULL,
	"cost_wood" double precision NOT NULL,
	"cost_stone" double precision NOT NULL,
	"cost_iron" double precision NOT NULL,
	"cost_gold" double precision NOT NULL,
	"cost_food" double precision NOT NULL,
	"per_unit_seconds" integer NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	CONSTRAINT "fief_recruit_orders_count_positive" CHECK ("fief_recruit_orders"."count" >= 1),
	CONSTRAINT "fief_recruit_orders_per_unit_seconds_positive" CHECK ("fief_recruit_orders"."per_unit_seconds" >= 1)
);
--> statement-breakpoint
CREATE TABLE "fief_units" (
	"fief_id" uuid NOT NULL,
	"kind" "unit" NOT NULL,
	"count" integer NOT NULL,
	CONSTRAINT "fief_units_pkey" PRIMARY KEY("fief_id","kind"),
	CONSTRAINT "fief_units_count_whole" CHECK ("fief_units"."count" >= 0)
);
--> statement-breakpoint
ALTER TABLE "fief_events" DROP CONSTRAINT "fief_events_building_or_art";--> statement-breakpoint
ALTER TABLE "fief_events" ALTER COLUMN "level" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "fief_events" ADD COLUMN "unit" "unit";--> statement-breakpoint
ALTER TABLE "fief_events" ADD COLUMN "count" integer;--> statement-breakpoint
ALTER TABLE "fief_recruit_orders" ADD CONSTRAINT "fief_recruit_orders_fief_id_fiefs_id_fk" FOREIGN KEY ("fief_id") REFERENCES "public"."fiefs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fief_units" ADD CONSTRAINT "fief_units_fief_id_fiefs_id_fk" FOREIGN KEY ("fief_id") REFERENCES "public"."fiefs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fief_events" ADD CONSTRAINT "fief_events_one_subject" CHECK (num_nonnulls("fief_events"."building", "fief_events"."art", "fief_events"."unit") = 1 AND ("fief_events"."level" IS NULL) = ("fief_events"."unit" IS NOT NULL) AND ("fief_events"."count" IS NULL) = ("fief_events"."unit" IS NULL));