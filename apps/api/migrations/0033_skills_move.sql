CREATE TABLE "earned_skills" (
	"player_id" uuid NOT NULL,
	"lesson_id" text NOT NULL,
	"resource" "town_resource" NOT NULL,
	"rate_percent" integer NOT NULL,
	"earned_at" timestamp with time zone NOT NULL,
	CONSTRAINT "earned_skills_pkey" PRIMARY KEY("player_id","lesson_id"),
	CONSTRAINT "earned_skills_rate_percent_positive" CHECK ("earned_skills"."rate_percent" >= 1)
);
--> statement-breakpoint
CREATE TABLE "town_lesson_slots" (
	"town_id" uuid PRIMARY KEY NOT NULL,
	"lesson_id" text NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"finishes_at" timestamp with time zone NOT NULL,
	CONSTRAINT "town_lesson_slots_started_before_finish" CHECK ("town_lesson_slots"."started_at" <= "town_lesson_slots"."finishes_at")
);
--> statement-breakpoint
ALTER TABLE "earned_skills" ADD CONSTRAINT "earned_skills_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "town_lesson_slots" ADD CONSTRAINT "town_lesson_slots_town_id_towns_id_fk" FOREIGN KEY ("town_id") REFERENCES "public"."towns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
DO $$
BEGIN
	IF EXISTS (SELECT 1 FROM "player_skills" WHERE "resource"::text <> 'food') THEN
		RAISE EXCEPTION 'player_skills holds a skill on a resource other than food';
	END IF;
	IF EXISTS (SELECT 1 FROM "towns") THEN
		RAISE EXCEPTION 'towns holds a town before the skills move';
	END IF;
	IF EXISTS (SELECT 1 FROM "fiefs" WHERE "study_lesson_id" IS NOT NULL AND "study_finishes_at" <= now()) THEN
		RAISE EXCEPTION 'a fief holds a lesson finished at or before the skills move';
	END IF;
END $$;--> statement-breakpoint
INSERT INTO "earned_skills" ("player_id", "lesson_id", "resource", "rate_percent", "earned_at")
	SELECT "player_id", "lesson_id", 'food', "rate_percent", "earned_at" FROM "player_skills";--> statement-breakpoint
UPDATE "fiefs" SET "study_lesson_id" = NULL, "study_started_at" = NULL, "study_finishes_at" = NULL
	WHERE "study_lesson_id" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "fiefs" DROP CONSTRAINT "fiefs_study_lesson_terms";--> statement-breakpoint
ALTER TABLE "fiefs" DROP COLUMN "study_lesson_id";
