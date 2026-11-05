CREATE TYPE "public"."town_building" AS ENUM('homes', 'farm', 'factory', 'power_station', 'storage', 'school', 'office');--> statement-breakpoint
CREATE TABLE "town_buildings" (
	"town_id" uuid NOT NULL,
	"building" "town_building" NOT NULL,
	"level" integer NOT NULL,
	CONSTRAINT "town_buildings_pkey" PRIMARY KEY("town_id","building"),
	CONSTRAINT "town_buildings_level_whole" CHECK ("town_buildings"."level" >= 0)
);
--> statement-breakpoint
CREATE TABLE "towns" (
	"id" uuid PRIMARY KEY NOT NULL,
	"player_id" uuid NOT NULL,
	"region" integer NOT NULL,
	"area" integer NOT NULL,
	"site" integer NOT NULL,
	"name" text NOT NULL,
	"money" double precision NOT NULL,
	"food" double precision NOT NULL,
	"power" double precision NOT NULL,
	"material" double precision NOT NULL,
	"stored_at" timestamp with time zone NOT NULL,
	"full_since_money" timestamp with time zone,
	"full_since_food" timestamp with time zone,
	"full_since_power" timestamp with time zone,
	"full_since_material" timestamp with time zone,
	CONSTRAINT "towns_player_unique" UNIQUE("player_id"),
	CONSTRAINT "towns_site_unique" UNIQUE("region","area","site"),
	CONSTRAINT "towns_address_positive" CHECK ("towns"."region" >= 1 AND "towns"."area" >= 1 AND "towns"."site" >= 1),
	CONSTRAINT "towns_money_whole" CHECK ("towns"."money" >= 0 AND "towns"."money" = trunc("towns"."money")),
	CONSTRAINT "towns_food_whole" CHECK ("towns"."food" >= 0 AND "towns"."food" = trunc("towns"."food")),
	CONSTRAINT "towns_power_whole" CHECK ("towns"."power" >= 0 AND "towns"."power" = trunc("towns"."power")),
	CONSTRAINT "towns_material_whole" CHECK ("towns"."material" >= 0 AND "towns"."material" = trunc("towns"."material"))
);
--> statement-breakpoint
ALTER TABLE "town_buildings" ADD CONSTRAINT "town_buildings_town_id_towns_id_fk" FOREIGN KEY ("town_id") REFERENCES "public"."towns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "towns" ADD CONSTRAINT "towns_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;