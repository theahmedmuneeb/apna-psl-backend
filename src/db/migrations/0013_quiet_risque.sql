CREATE TABLE "pending_tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"match_id" uuid NOT NULL,
	"seat_id" uuid NOT NULL,
	"match_id_bytes" varchar(66) NOT NULL,
	"seat_id_bytes" varchar(66) NOT NULL,
	"user_address" varchar(42) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pending_tickets" ADD CONSTRAINT "pending_tickets_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pending_tickets" ADD CONSTRAINT "pending_tickets_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pending_tickets" ADD CONSTRAINT "pending_tickets_seat_id_seats_id_fk" FOREIGN KEY ("seat_id") REFERENCES "public"."seats"("id") ON DELETE cascade ON UPDATE no action;