ALTER TABLE "fiefs" ADD COLUMN "slot_started_at" timestamp with time zone;--> statement-breakpoint
UPDATE "fiefs" SET "slot_started_at" = "stored_at" WHERE "slot_building" IS NOT NULL;
