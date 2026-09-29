CREATE TYPE "public"."march_order" AS ENUM('forage', 'attack');--> statement-breakpoint
CREATE TABLE "camp_battles" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "camp_battles_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"kingdom" integer NOT NULL,
	"province" integer NOT NULL,
	"plot" integer NOT NULL,
	"strength" integer NOT NULL,
	"fought_at" timestamp with time zone NOT NULL,
	CONSTRAINT "camp_battles_kingdom_positive" CHECK ("camp_battles"."kingdom" >= 1),
	CONSTRAINT "camp_battles_province_positive" CHECK ("camp_battles"."province" >= 1),
	CONSTRAINT "camp_battles_plot_positive" CHECK ("camp_battles"."plot" >= 1),
	CONSTRAINT "camp_battles_strength_whole" CHECK ("camp_battles"."strength" >= 0)
);
--> statement-breakpoint
ALTER TABLE "fief_marches" DROP CONSTRAINT "fief_marches_stay_hours_positive";--> statement-breakpoint
ALTER TABLE "fief_marches" ADD COLUMN "march_order" "march_order" DEFAULT 'forage' NOT NULL;--> statement-breakpoint
ALTER TABLE "fief_marches" ADD COLUMN "camp_tier" integer;--> statement-breakpoint
ALTER TABLE "fief_marches" ADD COLUMN "camp_strength" integer;--> statement-breakpoint
ALTER TABLE "fief_marches" ADD COLUMN "fought" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX "camp_battles_plot_order" ON "camp_battles" USING btree ("kingdom","province","plot","fought_at","id");--> statement-breakpoint
ALTER TABLE "fief_marches" ADD CONSTRAINT "fief_marches_order_terms" CHECK (("fief_marches"."march_order"::text = 'forage' AND "fief_marches"."stay_hours" >= 1 AND "fief_marches"."camp_tier" IS NULL AND "fief_marches"."camp_strength" IS NULL AND NOT "fief_marches"."fought") OR ("fief_marches"."march_order"::text = 'attack' AND "fief_marches"."stay_hours" = 0 AND "fief_marches"."camp_tier" IS NOT NULL AND "fief_marches"."camp_tier" BETWEEN 1 AND 3 AND "fief_marches"."camp_strength" IS NOT NULL AND "fief_marches"."camp_strength" >= 0));