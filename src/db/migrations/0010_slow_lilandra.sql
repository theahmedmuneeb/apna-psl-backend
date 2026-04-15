CREATE TYPE "public"."pricing_currency" AS ENUM('WIRE', 'PSL');--> statement-breakpoint
CREATE TABLE "stadiums" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(200) NOT NULL,
	"location" varchar(300) NOT NULL,
	"sportmonks_venue_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "enclosure_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "enclosure_categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "enclosures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stadium_id" uuid NOT NULL,
	"name" varchar(200) NOT NULL,
	"enclosure_category_id" uuid NOT NULL,
	"config" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"enclosure_id" uuid NOT NULL,
	"row_label" varchar(50) NOT NULL,
	"seat_number" integer NOT NULL,
	"label" varchar(50) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_seat_enclosure_row_number" UNIQUE("enclosure_id","row_label","seat_number")
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sportmonks_match_id" integer,
	"team_a_id" uuid NOT NULL,
	"team_b_id" uuid NOT NULL,
	"stadium_id" uuid NOT NULL,
	"start_time" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "match_pricing" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"match_id" uuid NOT NULL,
	"enclosure_category_id" uuid NOT NULL,
	"price" numeric(18, 6) NOT NULL,
	"currency" "pricing_currency" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_match_category_currency" UNIQUE("match_id","enclosure_category_id","currency")
);
--> statement-breakpoint
ALTER TABLE "enclosures" ADD CONSTRAINT "enclosures_stadium_id_stadiums_id_fk" FOREIGN KEY ("stadium_id") REFERENCES "public"."stadiums"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enclosures" ADD CONSTRAINT "enclosures_enclosure_category_id_enclosure_categories_id_fk" FOREIGN KEY ("enclosure_category_id") REFERENCES "public"."enclosure_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seats" ADD CONSTRAINT "seats_enclosure_id_enclosures_id_fk" FOREIGN KEY ("enclosure_id") REFERENCES "public"."enclosures"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_team_a_id_teams_id_fk" FOREIGN KEY ("team_a_id") REFERENCES "public"."teams"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_team_b_id_teams_id_fk" FOREIGN KEY ("team_b_id") REFERENCES "public"."teams"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_stadium_id_stadiums_id_fk" FOREIGN KEY ("stadium_id") REFERENCES "public"."stadiums"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_pricing" ADD CONSTRAINT "match_pricing_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_pricing" ADD CONSTRAINT "match_pricing_enclosure_category_id_enclosure_categories_id_fk" FOREIGN KEY ("enclosure_category_id") REFERENCES "public"."enclosure_categories"("id") ON DELETE restrict ON UPDATE no action;