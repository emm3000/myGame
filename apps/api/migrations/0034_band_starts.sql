CREATE TABLE "band_starts" (
	"player_id" uuid NOT NULL,
	"band" integer NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	CONSTRAINT "band_starts_pkey" PRIMARY KEY("player_id","band"),
	CONSTRAINT "band_starts_band_known" CHECK ("band_starts"."band" BETWEEN 1 AND 3)
);
--> statement-breakpoint
CREATE TABLE "held_out_words" (
	"player_id" uuid NOT NULL,
	"band" integer NOT NULL,
	"headword" text NOT NULL,
	CONSTRAINT "held_out_words_pkey" PRIMARY KEY("player_id","headword")
);
--> statement-breakpoint
ALTER TABLE "band_starts" ADD CONSTRAINT "band_starts_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "held_out_words" ADD CONSTRAINT "held_out_words_band_start_fk" FOREIGN KEY ("player_id","band") REFERENCES "public"."band_starts"("player_id","band") ON DELETE cascade ON UPDATE no action;