CREATE TYPE "public"."ticket_status" AS ENUM('valid', 'used', 'cancelled', 'expired');--> statement-breakpoint
CREATE TABLE "tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"match_id" uuid NOT NULL,
	"seat_id" uuid NOT NULL,
	"enclosure_category_id" uuid NOT NULL,
	"nft_contract_address" varchar(42),
	"nft_token_id" varchar(78),
	"nft_metadata" jsonb,
	"status" "ticket_status" DEFAULT 'valid' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_ticket_seat_match" UNIQUE("seat_id","match_id"),
	CONSTRAINT "uq_ticket_nft" UNIQUE("nft_contract_address","nft_token_id")
);
--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_owner_id_profiles_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_seat_id_seats_id_fk" FOREIGN KEY ("seat_id") REFERENCES "public"."seats"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_enclosure_category_id_enclosure_categories_id_fk" FOREIGN KEY ("enclosure_category_id") REFERENCES "public"."enclosure_categories"("id") ON DELETE restrict ON UPDATE no action;