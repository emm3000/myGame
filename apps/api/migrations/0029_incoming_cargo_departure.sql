ALTER TABLE "fief_incoming_cargo" ADD COLUMN "departed_at" timestamp with time zone;--> statement-breakpoint
UPDATE "fief_incoming_cargo" SET "departed_at" = "fief_marches"."departed_at" FROM "fief_marches" WHERE "fief_marches"."fief_id" = "fief_incoming_cargo"."from_fief_id" AND "fief_marches"."march_order"::text = 'transport' AND "fief_marches"."to_fief_id" = "fief_incoming_cargo"."fief_id" AND "fief_marches"."recalled_at" IS NULL AND "fief_marches"."departed_at" + "fief_marches"."one_way_seconds" * interval '1 second' = "fief_incoming_cargo"."arrives_at";--> statement-breakpoint
UPDATE "fief_incoming_cargo" SET "departed_at" = "arrives_at" WHERE "departed_at" IS NULL;--> statement-breakpoint
ALTER TABLE "fief_incoming_cargo" ALTER COLUMN "departed_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "fief_incoming_cargo" ADD CONSTRAINT "fief_incoming_cargo_departed_before_arrival" CHECK ("fief_incoming_cargo"."departed_at" <= "fief_incoming_cargo"."arrives_at");
