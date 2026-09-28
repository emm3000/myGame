CREATE TYPE "public"."art" AS ENUM('smithing', 'masonry');--> statement-breakpoint
CREATE TABLE "fief_arts" (
	"fief_id" uuid NOT NULL,
	"art" "art" NOT NULL,
	"level" integer NOT NULL,
	CONSTRAINT "fief_arts_pkey" PRIMARY KEY("fief_id","art")
);
--> statement-breakpoint
ALTER TABLE "fief_arts" ADD CONSTRAINT "fief_arts_fief_id_fiefs_id_fk" FOREIGN KEY ("fief_id") REFERENCES "public"."fiefs"("id") ON DELETE cascade ON UPDATE no action;