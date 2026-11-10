DROP TABLE "camp_battles";--> statement-breakpoint
DROP TABLE "fief_arts";--> statement-breakpoint
DROP TABLE "fief_buildings";--> statement-breakpoint
DROP TABLE "fief_events";--> statement-breakpoint
DROP TABLE "fief_incoming_cargo";--> statement-breakpoint
DROP TABLE "fief_marches";--> statement-breakpoint
DROP TABLE "fief_queue_entries";--> statement-breakpoint
DROP TABLE "fief_recruit_orders";--> statement-breakpoint
DROP TABLE "fief_units";--> statement-breakpoint
DROP TABLE "fiefs";--> statement-breakpoint
DROP TABLE "player_seen_hints";--> statement-breakpoint
DROP TABLE "player_skills";--> statement-breakpoint
ALTER TABLE "players" DROP COLUMN "digest_acknowledged_at";--> statement-breakpoint
DROP TYPE "public"."art";--> statement-breakpoint
DROP TYPE "public"."building";--> statement-breakpoint
DROP TYPE "public"."fief_event_kind";--> statement-breakpoint
DROP TYPE "public"."march_order";--> statement-breakpoint
DROP TYPE "public"."resource";--> statement-breakpoint
DROP TYPE "public"."terrain";--> statement-breakpoint
DROP TYPE "public"."unit";