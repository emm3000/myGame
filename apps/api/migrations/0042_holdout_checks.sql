CREATE TYPE "public"."holdout_check_kind" AS ENUM('begun', 'taken', 'skipped');--> statement-breakpoint
CREATE TABLE "holdout_check_words" (
	"player_id" uuid NOT NULL,
	"band" integer NOT NULL,
	"week" integer NOT NULL,
	"position" integer NOT NULL,
	"word_id" text NOT NULL,
	"is_held_out" boolean NOT NULL,
	CONSTRAINT "holdout_check_words_pkey" PRIMARY KEY("player_id","band","week","position"),
	CONSTRAINT "holdout_check_words_word_unique" UNIQUE("player_id","band","week","word_id"),
	CONSTRAINT "holdout_check_words_position_positive" CHECK ("holdout_check_words"."position" >= 1)
);
--> statement-breakpoint
CREATE TABLE "holdout_checks" (
	"player_id" uuid NOT NULL,
	"band" integer NOT NULL,
	"week" integer NOT NULL,
	"kind" "holdout_check_kind" NOT NULL,
	"begun_at" timestamp with time zone,
	"closed_at" timestamp with time zone,
	"held_out_score" integer,
	"practised_score" integer,
	CONSTRAINT "holdout_checks_pkey" PRIMARY KEY("player_id","band","week"),
	CONSTRAINT "holdout_checks_week_known" CHECK ("holdout_checks"."week" IN (8, 24)),
	CONSTRAINT "holdout_checks_kind_terms" CHECK (("holdout_checks"."kind" = 'begun' AND "holdout_checks"."begun_at" IS NOT NULL AND "holdout_checks"."closed_at" IS NULL AND "holdout_checks"."held_out_score" IS NULL AND "holdout_checks"."practised_score" IS NULL) OR ("holdout_checks"."kind" = 'taken' AND "holdout_checks"."begun_at" IS NOT NULL AND "holdout_checks"."closed_at" IS NOT NULL AND "holdout_checks"."held_out_score" IS NOT NULL AND "holdout_checks"."practised_score" IS NOT NULL AND "holdout_checks"."held_out_score" >= 0 AND "holdout_checks"."practised_score" >= 0 AND "holdout_checks"."begun_at" <= "holdout_checks"."closed_at") OR ("holdout_checks"."kind" = 'skipped' AND "holdout_checks"."begun_at" IS NULL AND "holdout_checks"."closed_at" IS NOT NULL AND "holdout_checks"."held_out_score" IS NULL AND "holdout_checks"."practised_score" IS NULL))
);
--> statement-breakpoint
ALTER TABLE "holdout_check_words" ADD CONSTRAINT "holdout_check_words_check_fk" FOREIGN KEY ("player_id","band","week") REFERENCES "public"."holdout_checks"("player_id","band","week") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "holdout_checks" ADD CONSTRAINT "holdout_checks_band_start_fk" FOREIGN KEY ("player_id","band") REFERENCES "public"."band_starts"("player_id","band") ON DELETE cascade ON UPDATE no action;