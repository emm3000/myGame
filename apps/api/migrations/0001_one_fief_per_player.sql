CREATE UNIQUE INDEX "fiefs_player_unique" ON "fiefs" USING btree ("player_id");--> statement-breakpoint
ALTER TABLE "fiefs" ADD CONSTRAINT "fiefs_wood_whole" CHECK ("fiefs"."wood" >= 0 AND "fiefs"."wood" = trunc("fiefs"."wood"));--> statement-breakpoint
ALTER TABLE "fiefs" ADD CONSTRAINT "fiefs_stone_whole" CHECK ("fiefs"."stone" >= 0 AND "fiefs"."stone" = trunc("fiefs"."stone"));--> statement-breakpoint
ALTER TABLE "fiefs" ADD CONSTRAINT "fiefs_iron_whole" CHECK ("fiefs"."iron" >= 0 AND "fiefs"."iron" = trunc("fiefs"."iron"));--> statement-breakpoint
ALTER TABLE "fiefs" ADD CONSTRAINT "fiefs_gold_whole" CHECK ("fiefs"."gold" >= 0 AND "fiefs"."gold" = trunc("fiefs"."gold"));--> statement-breakpoint
ALTER TABLE "fiefs" ADD CONSTRAINT "fiefs_food_whole" CHECK ("fiefs"."food" >= 0 AND "fiefs"."food" = trunc("fiefs"."food"));