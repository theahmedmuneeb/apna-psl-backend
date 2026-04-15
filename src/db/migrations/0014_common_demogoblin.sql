CREATE TABLE "sync_state" (
	"key" varchar(120) PRIMARY KEY NOT NULL,
	"last_synced_block" bigint DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "fantasy_battles" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "fantasy_notifications" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "fantasy_team_players" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "fantasy_teams" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "fantasy_votes" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "fantasy_battles" CASCADE;--> statement-breakpoint
DROP TABLE "fantasy_notifications" CASCADE;--> statement-breakpoint
DROP TABLE "fantasy_team_players" CASCADE;--> statement-breakpoint
DROP TABLE "fantasy_teams" CASCADE;--> statement-breakpoint
DROP TABLE "fantasy_votes" CASCADE;--> statement-breakpoint
ALTER TABLE "tickets" ALTER COLUMN "owner_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "wallet_address" varchar(42) NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" DROP COLUMN "xp";--> statement-breakpoint
DROP TYPE "public"."fantasy_battle_status";--> statement-breakpoint
DROP TYPE "public"."fantasy_notification_type";--> statement-breakpoint
DROP TYPE "public"."fantasy_vote_option";