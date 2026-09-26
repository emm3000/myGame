CREATE TABLE "fief_queue_entries" (
	"fief_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"building" "building" NOT NULL,
	"target_level" integer NOT NULL,
	"cost_wood" double precision NOT NULL,
	"cost_stone" double precision NOT NULL,
	"cost_iron" double precision NOT NULL,
	"cost_gold" double precision NOT NULL,
	"cost_food" double precision NOT NULL,
	"duration_seconds" integer NOT NULL,
	CONSTRAINT "fief_queue_entries_pkey" PRIMARY KEY("fief_id","position")
);
--> statement-breakpoint
ALTER TABLE "fief_queue_entries" ADD CONSTRAINT "fief_queue_entries_fief_id_fiefs_id_fk" FOREIGN KEY ("fief_id") REFERENCES "public"."fiefs"("id") ON DELETE cascade ON UPDATE no action;