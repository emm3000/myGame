CREATE TABLE "town_hires" (
	"town_id" uuid NOT NULL,
	"hire" "town_hire" NOT NULL,
	"count" integer NOT NULL,
	CONSTRAINT "town_hires_pkey" PRIMARY KEY("town_id","hire"),
	CONSTRAINT "town_hires_count_whole" CHECK ("town_hires"."count" >= 0)
);
--> statement-breakpoint
CREATE TABLE "town_hiring_orders" (
	"town_id" uuid PRIMARY KEY NOT NULL,
	"hire" "town_hire" NOT NULL,
	"count" integer NOT NULL,
	"cost_money" double precision NOT NULL,
	"cost_food" double precision NOT NULL,
	"cost_power" double precision NOT NULL,
	"cost_material" double precision NOT NULL,
	"seconds_per_hire" integer NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	CONSTRAINT "town_hiring_orders_count_positive" CHECK ("town_hiring_orders"."count" >= 1),
	CONSTRAINT "town_hiring_orders_seconds_per_hire_positive" CHECK ("town_hiring_orders"."seconds_per_hire" >= 1),
	CONSTRAINT "town_hiring_orders_cost_money_whole" CHECK ("town_hiring_orders"."cost_money" >= 0 AND "town_hiring_orders"."cost_money" = trunc("town_hiring_orders"."cost_money")),
	CONSTRAINT "town_hiring_orders_cost_food_whole" CHECK ("town_hiring_orders"."cost_food" >= 0 AND "town_hiring_orders"."cost_food" = trunc("town_hiring_orders"."cost_food")),
	CONSTRAINT "town_hiring_orders_cost_power_whole" CHECK ("town_hiring_orders"."cost_power" >= 0 AND "town_hiring_orders"."cost_power" = trunc("town_hiring_orders"."cost_power")),
	CONSTRAINT "town_hiring_orders_cost_material_whole" CHECK ("town_hiring_orders"."cost_material" >= 0 AND "town_hiring_orders"."cost_material" = trunc("town_hiring_orders"."cost_material"))
);
--> statement-breakpoint
ALTER TABLE "town_hires" ADD CONSTRAINT "town_hires_town_id_towns_id_fk" FOREIGN KEY ("town_id") REFERENCES "public"."towns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "town_hiring_orders" ADD CONSTRAINT "town_hiring_orders_town_id_towns_id_fk" FOREIGN KEY ("town_id") REFERENCES "public"."towns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
INSERT INTO "town_hires" ("town_id", "hire", "count")
SELECT "towns"."id", "kinds"."hire", 0
FROM "towns"
CROSS JOIN (VALUES ('worker'::"town_hire"), ('truck'::"town_hire")) AS "kinds"("hire");
