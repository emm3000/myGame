DROP INDEX "fiefs_player_unique";--> statement-breakpoint
CREATE INDEX "fiefs_player_id_index" ON "fiefs" USING btree ("player_id");