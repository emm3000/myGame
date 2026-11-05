CREATE TYPE "public"."town_event_kind" AS ENUM('building_work_finished', 'building_work_stopped', 'lesson_studied', 'lesson_stopped', 'skill_earned', 'hiring_delivered', 'hiring_stopped', 'job_back', 'job_called_back', 'clean_up_done', 'clean_up_failed', 'became_city');--> statement-breakpoint
CREATE TYPE "public"."town_hire" AS ENUM('worker', 'truck');--> statement-breakpoint
CREATE TYPE "public"."town_resource" AS ENUM('money', 'food', 'power', 'material');--> statement-breakpoint
CREATE TABLE "town_events" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "town_events_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"town_id" uuid NOT NULL,
	"kind" "town_event_kind" NOT NULL,
	"building" "town_building",
	"level" integer,
	"lesson_id" text,
	"resource" "town_resource",
	"rate_percent" integer,
	"hire" "town_hire",
	"count" integer,
	"stopped_count" integer,
	"region" integer,
	"area" integer,
	"site" integer,
	"amount_money" double precision DEFAULT 0 NOT NULL,
	"amount_food" double precision DEFAULT 0 NOT NULL,
	"amount_power" double precision DEFAULT 0 NOT NULL,
	"amount_material" double precision DEFAULT 0 NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	CONSTRAINT "town_events_building_terms" CHECK (CASE WHEN "town_events"."kind"::text IN ('building_work_finished', 'building_work_stopped') THEN "town_events"."building" IS NOT NULL AND "town_events"."level" IS NOT NULL AND "town_events"."level" >= 1 ELSE "town_events"."building" IS NULL AND "town_events"."level" IS NULL END),
	CONSTRAINT "town_events_site_terms" CHECK (num_nonnulls("town_events"."region", "town_events"."area", "town_events"."site") = 0 OR (num_nonnulls("town_events"."region", "town_events"."area", "town_events"."site") = 3 AND "town_events"."region" >= 1 AND "town_events"."area" >= 1 AND "town_events"."site" >= 1)),
	CONSTRAINT "town_events_amount_money_whole" CHECK ("town_events"."amount_money" >= 0 AND "town_events"."amount_money" = trunc("town_events"."amount_money")),
	CONSTRAINT "town_events_amount_food_whole" CHECK ("town_events"."amount_food" >= 0 AND "town_events"."amount_food" = trunc("town_events"."amount_food")),
	CONSTRAINT "town_events_amount_power_whole" CHECK ("town_events"."amount_power" >= 0 AND "town_events"."amount_power" = trunc("town_events"."amount_power")),
	CONSTRAINT "town_events_amount_material_whole" CHECK ("town_events"."amount_material" >= 0 AND "town_events"."amount_material" = trunc("town_events"."amount_material"))
);
--> statement-breakpoint
CREATE TABLE "town_waiting_work" (
	"town_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"building" "town_building" NOT NULL,
	"level" integer NOT NULL,
	"cost_money" double precision NOT NULL,
	"cost_food" double precision NOT NULL,
	"cost_power" double precision NOT NULL,
	"cost_material" double precision NOT NULL,
	"duration_seconds" integer NOT NULL,
	CONSTRAINT "town_waiting_work_pkey" PRIMARY KEY("town_id","position"),
	CONSTRAINT "town_waiting_work_position_whole" CHECK ("town_waiting_work"."position" >= 0),
	CONSTRAINT "town_waiting_work_level_positive" CHECK ("town_waiting_work"."level" >= 1),
	CONSTRAINT "town_waiting_work_duration_whole" CHECK ("town_waiting_work"."duration_seconds" >= 0),
	CONSTRAINT "town_waiting_work_cost_money_whole" CHECK ("town_waiting_work"."cost_money" >= 0 AND "town_waiting_work"."cost_money" = trunc("town_waiting_work"."cost_money")),
	CONSTRAINT "town_waiting_work_cost_food_whole" CHECK ("town_waiting_work"."cost_food" >= 0 AND "town_waiting_work"."cost_food" = trunc("town_waiting_work"."cost_food")),
	CONSTRAINT "town_waiting_work_cost_power_whole" CHECK ("town_waiting_work"."cost_power" >= 0 AND "town_waiting_work"."cost_power" = trunc("town_waiting_work"."cost_power")),
	CONSTRAINT "town_waiting_work_cost_material_whole" CHECK ("town_waiting_work"."cost_material" >= 0 AND "town_waiting_work"."cost_material" = trunc("town_waiting_work"."cost_material"))
);
--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "report_read_at" timestamp with time zone;--> statement-breakpoint
UPDATE "players" SET "report_read_at" = now();--> statement-breakpoint
ALTER TABLE "players" ALTER COLUMN "report_read_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "towns" ADD COLUMN "work_building" "town_building";--> statement-breakpoint
ALTER TABLE "towns" ADD COLUMN "work_level" integer;--> statement-breakpoint
ALTER TABLE "towns" ADD COLUMN "work_started_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "towns" ADD COLUMN "work_finishes_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "towns" ADD COLUMN "work_cost_money" double precision;--> statement-breakpoint
ALTER TABLE "towns" ADD COLUMN "work_cost_food" double precision;--> statement-breakpoint
ALTER TABLE "towns" ADD COLUMN "work_cost_power" double precision;--> statement-breakpoint
ALTER TABLE "towns" ADD COLUMN "work_cost_material" double precision;--> statement-breakpoint
ALTER TABLE "town_events" ADD CONSTRAINT "town_events_town_id_towns_id_fk" FOREIGN KEY ("town_id") REFERENCES "public"."towns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "town_waiting_work" ADD CONSTRAINT "town_waiting_work_town_id_towns_id_fk" FOREIGN KEY ("town_id") REFERENCES "public"."towns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "town_events_town_order" ON "town_events" USING btree ("town_id","occurred_at","id");--> statement-breakpoint
ALTER TABLE "towns" ADD CONSTRAINT "towns_work_slot_terms" CHECK (num_nonnulls("towns"."work_building", "towns"."work_level", "towns"."work_started_at", "towns"."work_finishes_at", "towns"."work_cost_money", "towns"."work_cost_food", "towns"."work_cost_power", "towns"."work_cost_material") = 0 OR (num_nonnulls("towns"."work_building", "towns"."work_level", "towns"."work_started_at", "towns"."work_finishes_at", "towns"."work_cost_money", "towns"."work_cost_food", "towns"."work_cost_power", "towns"."work_cost_material") = 8 AND "towns"."work_level" >= 1 AND "towns"."work_started_at" <= "towns"."work_finishes_at" AND "towns"."work_cost_money" >= 0 AND "towns"."work_cost_money" = trunc("towns"."work_cost_money") AND "towns"."work_cost_food" >= 0 AND "towns"."work_cost_food" = trunc("towns"."work_cost_food") AND "towns"."work_cost_power" >= 0 AND "towns"."work_cost_power" = trunc("towns"."work_cost_power") AND "towns"."work_cost_material" >= 0 AND "towns"."work_cost_material" = trunc("towns"."work_cost_material")));