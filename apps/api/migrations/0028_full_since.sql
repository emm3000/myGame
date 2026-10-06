CREATE TABLE "player_seen_hints" (
	"player_id" uuid NOT NULL,
	"hint" text NOT NULL,
	CONSTRAINT "player_seen_hints_pkey" PRIMARY KEY("player_id","hint")
);
--> statement-breakpoint
ALTER TABLE "fiefs" ADD COLUMN "full_since_wood" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "fiefs" ADD COLUMN "full_since_stone" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "fiefs" ADD COLUMN "full_since_iron" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "fiefs" ADD COLUMN "full_since_gold" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "fiefs" ADD COLUMN "full_since_food" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "fiefs" ADD COLUMN "guidance_dismissed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "digest_acknowledged_at" timestamp with time zone;--> statement-breakpoint
UPDATE "players" SET "digest_acknowledged_at" = now();--> statement-breakpoint
ALTER TABLE "players" ALTER COLUMN "digest_acknowledged_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "player_seen_hints" ADD CONSTRAINT "player_seen_hints_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;