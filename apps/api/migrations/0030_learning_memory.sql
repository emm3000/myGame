CREATE TYPE "public"."memory_rating" AS ENUM('again', 'hard', 'good', 'easy');--> statement-breakpoint
CREATE TYPE "public"."memory_state" AS ENUM('learning', 'review', 'relearning');--> statement-breakpoint
CREATE TYPE "public"."resource" AS ENUM('wood', 'stone', 'iron', 'gold', 'food');--> statement-breakpoint
CREATE TYPE "public"."review_format" AS ENUM('recognition', 'recall');--> statement-breakpoint
ALTER TYPE "public"."fief_event_kind" ADD VALUE 'lesson_learned';--> statement-breakpoint
ALTER TYPE "public"."fief_event_kind" ADD VALUE 'lesson_cancelled';--> statement-breakpoint
CREATE TABLE "cards" (
	"player_id" uuid NOT NULL,
	"word_id" text NOT NULL,
	"state" "memory_state" NOT NULL,
	"step" integer,
	"stability" double precision,
	"difficulty" double precision,
	"last_review_at" timestamp with time zone,
	"last_rating" "memory_rating",
	"entered_at" timestamp with time zone NOT NULL,
	"retained_at" timestamp with time zone,
	CONSTRAINT "cards_pkey" PRIMARY KEY("player_id","word_id"),
	CONSTRAINT "cards_step_terms" CHECK (("cards"."step" IS NULL) = ("cards"."state"::text = 'review') AND ("cards"."step" IS NULL OR "cards"."step" >= 0)),
	CONSTRAINT "cards_review_terms" CHECK (num_nulls("cards"."stability", "cards"."difficulty", "cards"."last_review_at", "cards"."last_rating") IN (0, 4) AND ("cards"."last_review_at" IS NOT NULL OR "cards"."state"::text = 'learning')),
	CONSTRAINT "cards_memory_bounds" CHECK (("cards"."stability" IS NULL OR "cards"."stability" > 0) AND ("cards"."difficulty" IS NULL OR "cards"."difficulty" BETWEEN 1 AND 10)),
	CONSTRAINT "cards_retained_at_last_review" CHECK ("cards"."retained_at" IS NULL OR "cards"."retained_at" = "cards"."last_review_at")
);
--> statement-breakpoint
CREATE TABLE "pending_reviews" (
	"player_id" uuid NOT NULL,
	"word_id" text NOT NULL,
	"hint_shown" boolean NOT NULL,
	"near_miss_answer" text,
	CONSTRAINT "pending_reviews_pkey" PRIMARY KEY("player_id","word_id")
);
--> statement-breakpoint
CREATE TABLE "player_skills" (
	"player_id" uuid NOT NULL,
	"lesson_id" text NOT NULL,
	"resource" "resource" NOT NULL,
	"rate_percent" integer NOT NULL,
	"earned_at" timestamp with time zone NOT NULL,
	CONSTRAINT "player_skills_pkey" PRIMARY KEY("player_id","lesson_id"),
	CONSTRAINT "player_skills_rate_percent_positive" CHECK ("player_skills"."rate_percent" >= 1)
);
--> statement-breakpoint
CREATE TABLE "review_log" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "review_log_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"player_id" uuid NOT NULL,
	"word_id" text NOT NULL,
	"reviewed_at" timestamp with time zone NOT NULL,
	"format" "review_format" NOT NULL,
	"answer" text NOT NULL,
	"near_miss_answer" text,
	"hint_shown" boolean NOT NULL,
	"rating" "memory_rating" NOT NULL,
	"elapsed_days" integer,
	"before_state" "memory_state" NOT NULL,
	"before_step" integer,
	"before_stability" double precision,
	"before_difficulty" double precision,
	"before_last_review_at" timestamp with time zone,
	"before_last_rating" "memory_rating",
	"before_entered_at" timestamp with time zone NOT NULL,
	"before_retained_at" timestamp with time zone,
	"after_state" "memory_state" NOT NULL,
	"after_step" integer,
	"after_stability" double precision NOT NULL,
	"after_difficulty" double precision NOT NULL,
	"after_last_review_at" timestamp with time zone NOT NULL,
	"after_last_rating" "memory_rating" NOT NULL,
	"after_entered_at" timestamp with time zone NOT NULL,
	"after_retained_at" timestamp with time zone,
	CONSTRAINT "review_log_elapsed_days_terms" CHECK (("review_log"."elapsed_days" IS NULL) = ("review_log"."before_last_review_at" IS NULL) AND ("review_log"."elapsed_days" IS NULL OR "review_log"."elapsed_days" >= 0))
);
--> statement-breakpoint
ALTER TABLE "fief_events" DROP CONSTRAINT "fief_events_one_subject";--> statement-breakpoint
ALTER TABLE "fief_events" ADD COLUMN "lesson_id" text;--> statement-breakpoint
ALTER TABLE "fiefs" ADD COLUMN "study_lesson_id" text;--> statement-breakpoint
ALTER TABLE "cards" ADD CONSTRAINT "cards_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pending_reviews" ADD CONSTRAINT "pending_reviews_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pending_reviews" ADD CONSTRAINT "pending_reviews_card_fk" FOREIGN KEY ("player_id","word_id") REFERENCES "public"."cards"("player_id","word_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_skills" ADD CONSTRAINT "player_skills_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_log" ADD CONSTRAINT "review_log_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "review_log_player_order" ON "review_log" USING btree ("player_id","reviewed_at","id");--> statement-breakpoint
ALTER TABLE "fief_events" ADD CONSTRAINT "fief_events_lesson_terms" CHECK (("fief_events"."lesson_id" IS NOT NULL) = ("fief_events"."kind"::text IN ('lesson_learned', 'lesson_cancelled')));--> statement-breakpoint
ALTER TABLE "fief_events" ADD CONSTRAINT "fief_events_one_subject" CHECK (num_nonnulls("fief_events"."building", "fief_events"."art", "fief_events"."unit", "fief_events"."infantry_count", "fief_events"."fief_name", "fief_events"."lesson_id") = 1 AND ("fief_events"."infantry_count" IS NULL) = ("fief_events"."cavalry_count" IS NULL) AND ("fief_events"."infantry_count" IS NULL) = ("fief_events"."archer_count" IS NULL) AND ("fief_events"."infantry_count" IS NULL) = ("fief_events"."settler_count" IS NULL) AND ("fief_events"."level" IS NULL) = ("fief_events"."building" IS NULL AND "fief_events"."art" IS NULL) AND ("fief_events"."count" IS NULL) = ("fief_events"."unit" IS NULL) AND ("fief_events"."cancelled_count" IS NULL OR ("fief_events"."unit" IS NOT NULL AND "fief_events"."cancelled_count" >= 1)) AND ("fief_events"."province" IS NULL) = ("fief_events"."infantry_count" IS NULL AND "fief_events"."fief_name" IS NULL) AND ("fief_events"."plot" IS NULL) = ("fief_events"."infantry_count" IS NULL AND "fief_events"."fief_name" IS NULL) AND ("fief_events"."province" IS NULL OR ("fief_events"."province" >= 1 AND "fief_events"."plot" >= 1)));--> statement-breakpoint
ALTER TABLE "fiefs" ADD CONSTRAINT "fiefs_study_lesson_terms" CHECK ("fiefs"."study_lesson_id" IS NULL OR ("fiefs"."study_art" IS NULL AND "fiefs"."study_level" IS NULL AND "fiefs"."study_started_at" IS NOT NULL AND "fiefs"."study_finishes_at" IS NOT NULL AND "fiefs"."study_cost_wood" = 0 AND "fiefs"."study_cost_stone" = 0 AND "fiefs"."study_cost_iron" = 0 AND "fiefs"."study_cost_gold" = 0 AND "fiefs"."study_cost_food" = 0));