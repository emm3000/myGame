CREATE TABLE "site_clean_ups" (
	"town_id" uuid NOT NULL,
	"sent_at" timestamp with time zone NOT NULL,
	"region" integer NOT NULL,
	"area" integer NOT NULL,
	"site" integer NOT NULL,
	"cleaned_at" timestamp with time zone NOT NULL,
	CONSTRAINT "site_clean_ups_pkey" PRIMARY KEY("town_id","sent_at"),
	CONSTRAINT "site_clean_ups_site_positive" CHECK ("site_clean_ups"."region" >= 1 AND "site_clean_ups"."area" >= 1 AND "site_clean_ups"."site" >= 1),
	CONSTRAINT "site_clean_ups_cleaned_after_sent" CHECK ("site_clean_ups"."cleaned_at" >= "site_clean_ups"."sent_at")
);
--> statement-breakpoint
ALTER TABLE "town_jobs" DROP CONSTRAINT "town_jobs_hours_positive";--> statement-breakpoint
ALTER TABLE "town_jobs" ADD COLUMN "waste_size" integer;--> statement-breakpoint
ALTER TABLE "town_jobs" ADD COLUMN "waste" integer;--> statement-breakpoint
ALTER TABLE "town_jobs" ADD COLUMN "strength" integer;--> statement-breakpoint
ALTER TABLE "town_jobs" ADD COLUMN "has_arrived" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "site_clean_ups" ADD CONSTRAINT "site_clean_ups_town_id_towns_id_fk" FOREIGN KEY ("town_id") REFERENCES "public"."towns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "site_clean_ups_site_order" ON "site_clean_ups" USING btree ("region","area","site","cleaned_at");--> statement-breakpoint
ALTER TABLE "town_jobs" ADD CONSTRAINT "town_jobs_clean_up_terms" CHECK (("town_jobs"."waste_size" IS NULL AND "town_jobs"."waste" IS NULL AND "town_jobs"."strength" IS NULL AND NOT "town_jobs"."has_arrived" AND "town_jobs"."hours" >= 1) OR ("town_jobs"."waste_size" IS NOT NULL AND "town_jobs"."waste" IS NOT NULL AND "town_jobs"."strength" IS NOT NULL AND "town_jobs"."waste_size" BETWEEN 1 AND 3 AND "town_jobs"."waste" >= 0 AND "town_jobs"."strength" >= 1 AND "town_jobs"."hours" = 0 AND NOT ("town_jobs"."has_arrived" AND "town_jobs"."called_back_at" IS NOT NULL)));