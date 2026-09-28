ALTER TABLE "fiefs" ADD COLUMN "study_art" "art";--> statement-breakpoint
ALTER TABLE "fiefs" ADD COLUMN "study_level" integer;--> statement-breakpoint
ALTER TABLE "fiefs" ADD COLUMN "study_started_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "fiefs" ADD COLUMN "study_finishes_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "fiefs" ADD COLUMN "study_cost_wood" double precision DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "fiefs" ADD COLUMN "study_cost_stone" double precision DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "fiefs" ADD COLUMN "study_cost_iron" double precision DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "fiefs" ADD COLUMN "study_cost_gold" double precision DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "fiefs" ADD COLUMN "study_cost_food" double precision DEFAULT 0 NOT NULL;