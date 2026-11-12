CREATE TYPE "public"."placement_kind" AS ENUM('taken', 'skipped');--> statement-breakpoint
CREATE TABLE "placement_scores" (
	"player_id" uuid NOT NULL,
	"band" integer NOT NULL,
	"score" integer NOT NULL,
	"taken_at" timestamp with time zone NOT NULL,
	CONSTRAINT "placement_scores_pkey" PRIMARY KEY("player_id","band"),
	CONSTRAINT "placement_scores_band_known" CHECK ("placement_scores"."band" BETWEEN 1 AND 3),
	CONSTRAINT "placement_scores_score_range" CHECK ("placement_scores"."score" BETWEEN 0 AND 30)
);
--> statement-breakpoint
CREATE TABLE "placement_words" (
	"player_id" uuid NOT NULL,
	"band" integer NOT NULL,
	"position" integer NOT NULL,
	"word_id" text NOT NULL,
	CONSTRAINT "placement_words_pkey" PRIMARY KEY("player_id","band","position"),
	CONSTRAINT "placement_words_word_unique" UNIQUE("player_id","band","word_id"),
	CONSTRAINT "placement_words_band_known" CHECK ("placement_words"."band" BETWEEN 1 AND 3),
	CONSTRAINT "placement_words_position_positive" CHECK ("placement_words"."position" >= 1)
);
--> statement-breakpoint
CREATE TABLE "placements" (
	"player_id" uuid PRIMARY KEY NOT NULL,
	"kind" "placement_kind" NOT NULL,
	"decided_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "placement_scores" ADD CONSTRAINT "placement_scores_placement_fk" FOREIGN KEY ("player_id") REFERENCES "public"."placements"("player_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_words" ADD CONSTRAINT "placement_words_placement_fk" FOREIGN KEY ("player_id") REFERENCES "public"."placements"("player_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placements" ADD CONSTRAINT "placements_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;