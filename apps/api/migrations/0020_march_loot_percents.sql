ALTER TABLE "fief_marches" ADD COLUMN "loot_percent_wood" integer DEFAULT 100 NOT NULL;--> statement-breakpoint
ALTER TABLE "fief_marches" ALTER COLUMN "loot_percent_wood" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "fief_marches" ADD COLUMN "loot_percent_stone" integer DEFAULT 100 NOT NULL;--> statement-breakpoint
ALTER TABLE "fief_marches" ALTER COLUMN "loot_percent_stone" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "fief_marches" ADD COLUMN "loot_percent_iron" integer DEFAULT 100 NOT NULL;--> statement-breakpoint
ALTER TABLE "fief_marches" ALTER COLUMN "loot_percent_iron" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "fief_marches" ADD COLUMN "loot_percent_gold" integer DEFAULT 100 NOT NULL;--> statement-breakpoint
ALTER TABLE "fief_marches" ALTER COLUMN "loot_percent_gold" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "fief_marches" ADD COLUMN "loot_percent_food" integer DEFAULT 100 NOT NULL;--> statement-breakpoint
ALTER TABLE "fief_marches" ALTER COLUMN "loot_percent_food" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "fief_marches" ADD CONSTRAINT "fief_marches_loot_percent_wood_positive" CHECK ("fief_marches"."loot_percent_wood" >= 1);--> statement-breakpoint
ALTER TABLE "fief_marches" ADD CONSTRAINT "fief_marches_loot_percent_stone_positive" CHECK ("fief_marches"."loot_percent_stone" >= 1);--> statement-breakpoint
ALTER TABLE "fief_marches" ADD CONSTRAINT "fief_marches_loot_percent_iron_positive" CHECK ("fief_marches"."loot_percent_iron" >= 1);--> statement-breakpoint
ALTER TABLE "fief_marches" ADD CONSTRAINT "fief_marches_loot_percent_gold_positive" CHECK ("fief_marches"."loot_percent_gold" >= 1);--> statement-breakpoint
ALTER TABLE "fief_marches" ADD CONSTRAINT "fief_marches_loot_percent_food_positive" CHECK ("fief_marches"."loot_percent_food" >= 1);