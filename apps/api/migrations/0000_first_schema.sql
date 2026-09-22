CREATE TYPE "public"."building" AS ENUM('sawmill', 'quarry', 'iron_mine', 'farm', 'warehouse');--> statement-breakpoint
CREATE TYPE "public"."terrain" AS ENUM('lowlands', 'uplands', 'ridges');--> statement-breakpoint
CREATE TABLE "fief_buildings" (
	"fief_id" uuid NOT NULL,
	"building" "building" NOT NULL,
	"level" integer NOT NULL,
	CONSTRAINT "fief_buildings_pkey" PRIMARY KEY("fief_id","building")
);
--> statement-breakpoint
CREATE TABLE "fiefs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"player_id" uuid NOT NULL,
	"kingdom" integer NOT NULL,
	"province" integer NOT NULL,
	"plot" integer NOT NULL,
	"terrain" "terrain" NOT NULL,
	"name" text NOT NULL,
	"wood" double precision NOT NULL,
	"stone" double precision NOT NULL,
	"iron" double precision NOT NULL,
	"gold" double precision NOT NULL,
	"food" double precision NOT NULL,
	"stored_at" timestamp with time zone NOT NULL,
	"slot_building" "building",
	"slot_level" integer,
	"slot_finishes_at" timestamp with time zone,
	CONSTRAINT "fiefs_coordinates_unique" UNIQUE("kingdom","province","plot")
);
--> statement-breakpoint
CREATE TABLE "players" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"token" text PRIMARY KEY NOT NULL,
	"player_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "fief_buildings" ADD CONSTRAINT "fief_buildings_fief_id_fiefs_id_fk" FOREIGN KEY ("fief_id") REFERENCES "public"."fiefs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fiefs" ADD CONSTRAINT "fiefs_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "players_email_unique" ON "players" USING btree (lower("email"));