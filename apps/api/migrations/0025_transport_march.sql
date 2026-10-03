ALTER TYPE "public"."march_order" ADD VALUE 'transport';--> statement-breakpoint
CREATE TABLE "fief_incoming_cargo" (
	"fief_id" uuid PRIMARY KEY NOT NULL,
	"from_fief_id" uuid NOT NULL,
	"from_name" text NOT NULL,
	"from_province" integer NOT NULL,
	"from_plot" integer NOT NULL,
	"cargo_wood" double precision NOT NULL,
	"cargo_stone" double precision NOT NULL,
	"cargo_iron" double precision NOT NULL,
	"cargo_gold" double precision NOT NULL,
	"cargo_food" double precision NOT NULL,
	"arrives_at" timestamp with time zone NOT NULL,
	CONSTRAINT "fief_incoming_cargo_from_province_positive" CHECK ("fief_incoming_cargo"."from_province" >= 1),
	CONSTRAINT "fief_incoming_cargo_from_plot_positive" CHECK ("fief_incoming_cargo"."from_plot" >= 1),
	CONSTRAINT "fief_incoming_cargo_cargo_wood_whole" CHECK ("fief_incoming_cargo"."cargo_wood" >= 0 AND "fief_incoming_cargo"."cargo_wood" = trunc("fief_incoming_cargo"."cargo_wood")),
	CONSTRAINT "fief_incoming_cargo_cargo_stone_whole" CHECK ("fief_incoming_cargo"."cargo_stone" >= 0 AND "fief_incoming_cargo"."cargo_stone" = trunc("fief_incoming_cargo"."cargo_stone")),
	CONSTRAINT "fief_incoming_cargo_cargo_iron_whole" CHECK ("fief_incoming_cargo"."cargo_iron" >= 0 AND "fief_incoming_cargo"."cargo_iron" = trunc("fief_incoming_cargo"."cargo_iron")),
	CONSTRAINT "fief_incoming_cargo_cargo_gold_whole" CHECK ("fief_incoming_cargo"."cargo_gold" >= 0 AND "fief_incoming_cargo"."cargo_gold" = trunc("fief_incoming_cargo"."cargo_gold")),
	CONSTRAINT "fief_incoming_cargo_cargo_food_whole" CHECK ("fief_incoming_cargo"."cargo_food" >= 0 AND "fief_incoming_cargo"."cargo_food" = trunc("fief_incoming_cargo"."cargo_food"))
);
--> statement-breakpoint
ALTER TABLE "fief_marches" DROP CONSTRAINT "fief_marches_order_terms";--> statement-breakpoint
ALTER TABLE "fief_marches" ADD COLUMN "to_fief_id" uuid;--> statement-breakpoint
ALTER TABLE "fief_marches" ADD COLUMN "cargo_wood" double precision;--> statement-breakpoint
ALTER TABLE "fief_marches" ADD COLUMN "cargo_stone" double precision;--> statement-breakpoint
ALTER TABLE "fief_marches" ADD COLUMN "cargo_iron" double precision;--> statement-breakpoint
ALTER TABLE "fief_marches" ADD COLUMN "cargo_gold" double precision;--> statement-breakpoint
ALTER TABLE "fief_marches" ADD COLUMN "cargo_food" double precision;--> statement-breakpoint
ALTER TABLE "fief_incoming_cargo" ADD CONSTRAINT "fief_incoming_cargo_fief_id_fiefs_id_fk" FOREIGN KEY ("fief_id") REFERENCES "public"."fiefs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fief_marches" ADD CONSTRAINT "fief_marches_transport_cargo" CHECK (("fief_marches"."march_order"::text = 'transport' AND "fief_marches"."to_fief_id" IS NOT NULL AND "fief_marches"."cargo_wood" IS NOT NULL AND "fief_marches"."cargo_stone" IS NOT NULL AND "fief_marches"."cargo_iron" IS NOT NULL AND "fief_marches"."cargo_gold" IS NOT NULL AND "fief_marches"."cargo_food" IS NOT NULL AND "fief_marches"."cargo_wood" + "fief_marches"."cargo_stone" + "fief_marches"."cargo_iron" + "fief_marches"."cargo_gold" + "fief_marches"."cargo_food" >= 1) OR ("fief_marches"."march_order"::text <> 'transport' AND "fief_marches"."to_fief_id" IS NULL AND "fief_marches"."cargo_wood" IS NULL AND "fief_marches"."cargo_stone" IS NULL AND "fief_marches"."cargo_iron" IS NULL AND "fief_marches"."cargo_gold" IS NULL AND "fief_marches"."cargo_food" IS NULL));--> statement-breakpoint
ALTER TABLE "fief_marches" ADD CONSTRAINT "fief_marches_cargo_wood_whole" CHECK ("fief_marches"."cargo_wood" >= 0 AND "fief_marches"."cargo_wood" = trunc("fief_marches"."cargo_wood"));--> statement-breakpoint
ALTER TABLE "fief_marches" ADD CONSTRAINT "fief_marches_cargo_stone_whole" CHECK ("fief_marches"."cargo_stone" >= 0 AND "fief_marches"."cargo_stone" = trunc("fief_marches"."cargo_stone"));--> statement-breakpoint
ALTER TABLE "fief_marches" ADD CONSTRAINT "fief_marches_cargo_iron_whole" CHECK ("fief_marches"."cargo_iron" >= 0 AND "fief_marches"."cargo_iron" = trunc("fief_marches"."cargo_iron"));--> statement-breakpoint
ALTER TABLE "fief_marches" ADD CONSTRAINT "fief_marches_cargo_gold_whole" CHECK ("fief_marches"."cargo_gold" >= 0 AND "fief_marches"."cargo_gold" = trunc("fief_marches"."cargo_gold"));--> statement-breakpoint
ALTER TABLE "fief_marches" ADD CONSTRAINT "fief_marches_cargo_food_whole" CHECK ("fief_marches"."cargo_food" >= 0 AND "fief_marches"."cargo_food" = trunc("fief_marches"."cargo_food"));--> statement-breakpoint
ALTER TABLE "fief_marches" ADD CONSTRAINT "fief_marches_order_terms" CHECK (("fief_marches"."march_order"::text = 'forage' AND "fief_marches"."stay_hours" >= 1 AND "fief_marches"."camp_tier" IS NULL AND "fief_marches"."camp_strength" IS NULL AND NOT "fief_marches"."fought" AND "fief_marches"."founding_name" IS NULL) OR ("fief_marches"."march_order"::text = 'attack' AND "fief_marches"."stay_hours" = 0 AND "fief_marches"."camp_tier" IS NOT NULL AND "fief_marches"."camp_tier" BETWEEN 1 AND 3 AND "fief_marches"."camp_strength" IS NOT NULL AND "fief_marches"."camp_strength" >= 0 AND "fief_marches"."founding_name" IS NULL) OR ("fief_marches"."march_order"::text = 'found' AND "fief_marches"."stay_hours" = 0 AND "fief_marches"."camp_tier" IS NULL AND "fief_marches"."camp_strength" IS NULL AND NOT "fief_marches"."fought" AND "fief_marches"."founding_name" IS NOT NULL AND "fief_marches"."settler_count" = 1 AND "fief_marches"."infantry_count" = 0 AND "fief_marches"."cavalry_count" = 0) OR ("fief_marches"."march_order"::text = 'transport' AND "fief_marches"."stay_hours" = 0 AND "fief_marches"."camp_tier" IS NULL AND "fief_marches"."camp_strength" IS NULL AND NOT "fief_marches"."fought" AND "fief_marches"."founding_name" IS NULL AND "fief_marches"."settler_count" = 0));