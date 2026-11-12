CREATE TYPE "public"."town_tip" AS ENUM('people', 'seasons', 'waiting_list', 'office', 'jobs', 'full_store');--> statement-breakpoint
CREATE TABLE "player_seen_tips" (
	"player_id" uuid NOT NULL,
	"tip" "town_tip" NOT NULL,
	CONSTRAINT "player_seen_tips_pkey" PRIMARY KEY("player_id","tip")
);
--> statement-breakpoint
ALTER TABLE "towns" ADD COLUMN "guidance_dismissed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "player_seen_tips" ADD CONSTRAINT "player_seen_tips_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;