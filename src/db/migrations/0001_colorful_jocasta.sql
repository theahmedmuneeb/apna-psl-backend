CREATE TYPE "public"."profile_gender" AS ENUM('male', 'female', 'other', 'prefer_not_to_say');--> statement-breakpoint
CREATE TYPE "public"."match_status" AS ENUM('scheduled', 'live', 'completed', 'cancelled', 'postponed');--> statement-breakpoint
CREATE TYPE "public"."ticket_chain_tx_type" AS ENUM('mint', 'purchase', 'transfer', 'burn', 'refund');--> statement-breakpoint
CREATE TYPE "public"."ticket_status" AS ENUM('reserved', 'purchased', 'cancelled', 'refunded', 'used');--> statement-breakpoint
CREATE TYPE "public"."ticket_token_status" AS ENUM('pending_mint', 'minted', 'transferred', 'burned', 'frozen');--> statement-breakpoint
CREATE TYPE "public"."token_standard" AS ENUM('erc721', 'erc1155');--> statement-breakpoint
CREATE TYPE "public"."blockchain_network" AS ENUM('ethereum', 'polygon', 'bsc', 'avalanche', 'arbitrum', 'base', 'other');--> statement-breakpoint
CREATE TABLE "matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"season" varchar(20) NOT NULL,
	"match_number" integer,
	"home_team_id" integer NOT NULL,
	"away_team_id" integer NOT NULL,
	"venue_name" varchar(120) NOT NULL,
	"venue_city" varchar(80) NOT NULL,
	"start_time" timestamp with time zone NOT NULL,
	"gate_open_time" timestamp with time zone,
	"status" "match_status" DEFAULT 'scheduled' NOT NULL,
	"ticket_sales_open_at" timestamp with time zone,
	"ticket_sales_close_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "teams_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(100) NOT NULL,
	"short_name" varchar(10) NOT NULL,
	"city" varchar(80) NOT NULL,
	"home_stadium" varchar(120),
	"logo_url" varchar(255),
	"founded_year" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "teams_name_unique" UNIQUE("name"),
	CONSTRAINT "teams_short_name_unique" UNIQUE("short_name")
);
--> statement-breakpoint
CREATE TABLE "ticket_categories" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "ticket_categories_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"match_id" uuid NOT NULL,
	"name" varchar(60) NOT NULL,
	"description" text,
	"price" numeric(10, 2) NOT NULL,
	"total_quantity" integer NOT NULL,
	"available_quantity" integer NOT NULL,
	"max_per_order" integer DEFAULT 6 NOT NULL,
	"sale_start_at" timestamp with time zone,
	"sale_end_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ticket_chain_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid NOT NULL,
	"ticket_token_id" uuid,
	"network" "blockchain_network" NOT NULL,
	"transaction_type" "ticket_chain_tx_type" NOT NULL,
	"tx_hash" varchar(100) NOT NULL,
	"from_address" varchar(100),
	"to_address" varchar(100),
	"block_number" integer,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"occurred_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ticket_chain_transactions_tx_hash_unique" UNIQUE("tx_hash")
);
--> statement-breakpoint
CREATE TABLE "ticket_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid NOT NULL,
	"network" "blockchain_network" NOT NULL,
	"token_standard" "token_standard" NOT NULL,
	"contract_address" varchar(100) NOT NULL,
	"token_id" varchar(128) NOT NULL,
	"metadata_uri" varchar(500),
	"mint_tx_hash" varchar(100),
	"owner_wallet_address" varchar(100),
	"status" "ticket_token_status" DEFAULT 'pending_mint' NOT NULL,
	"minted_at" timestamp with time zone,
	"burned_at" timestamp with time zone,
	"last_synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_number" varchar(32) NOT NULL,
	"match_id" uuid NOT NULL,
	"ticket_category_id" integer NOT NULL,
	"buyer_profile_id" uuid,
	"buyer_wallet_id" uuid,
	"requires_onchain_mint" boolean DEFAULT true NOT NULL,
	"holder_name" varchar(120),
	"holder_cnic" varchar(15),
	"seat_section" varchar(50),
	"seat_row" varchar(20),
	"seat_number" varchar(20),
	"qr_code_data" text NOT NULL,
	"price_paid" numeric(10, 2) NOT NULL,
	"status" "ticket_status" DEFAULT 'reserved' NOT NULL,
	"reserved_at" timestamp with time zone DEFAULT now() NOT NULL,
	"purchased_at" timestamp with time zone,
	"checked_in_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tickets_ticket_number_unique" UNIQUE("ticket_number")
);
--> statement-breakpoint
CREATE TABLE "user_wallets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"network" "blockchain_network" NOT NULL,
	"address" varchar(100) NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "profiles" DROP CONSTRAINT "profiles_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "full_name" varchar(240) NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "cnic" varchar(15) NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "date_of_birth" date;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "gender" "profile_gender";--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "city" varchar(80);--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_home_team_id_teams_id_fk" FOREIGN KEY ("home_team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_away_team_id_teams_id_fk" FOREIGN KEY ("away_team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_categories" ADD CONSTRAINT "ticket_categories_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_chain_transactions" ADD CONSTRAINT "ticket_chain_transactions_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_chain_transactions" ADD CONSTRAINT "ticket_chain_transactions_ticket_token_id_ticket_tokens_id_fk" FOREIGN KEY ("ticket_token_id") REFERENCES "public"."ticket_tokens"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_tokens" ADD CONSTRAINT "ticket_tokens_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_ticket_category_id_ticket_categories_id_fk" FOREIGN KEY ("ticket_category_id") REFERENCES "public"."ticket_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_buyer_profile_id_profiles_id_fk" FOREIGN KEY ("buyer_profile_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_buyer_wallet_id_user_wallets_id_fk" FOREIGN KEY ("buyer_wallet_id") REFERENCES "public"."user_wallets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_wallets" ADD CONSTRAINT "user_wallets_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ticket_categories_match_name_unique" ON "ticket_categories" USING btree ("match_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "ticket_tokens_ticket_unique" ON "ticket_tokens" USING btree ("ticket_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ticket_tokens_network_contract_token_unique" ON "ticket_tokens" USING btree ("network","contract_address","token_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_wallets_network_address_unique" ON "user_wallets" USING btree ("network","address");--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_cnic_unique" UNIQUE("cnic");