CREATE TYPE "public"."fantasy_battle_status" AS ENUM('open', 'active', 'completed');--> statement-breakpoint
CREATE TYPE "public"."fantasy_notification_type" AS ENUM('win', 'loss', 'tie');--> statement-breakpoint
CREATE TYPE "public"."fantasy_vote_option" AS ENUM('A', 'B');--> statement-breakpoint
CREATE TABLE "fantasy_battles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"creator_id" uuid NOT NULL,
	"team_a_id" uuid NOT NULL,
	"team_b_id" uuid,
	"status" "fantasy_battle_status" DEFAULT 'open' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"winner_team_id" uuid,
	"reward_sent" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fantasy_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "fantasy_notification_type" NOT NULL,
	"battle_id" uuid NOT NULL,
	"title" varchar(200) NOT NULL,
	"message" varchar(500) NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fantasy_team_players" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fantasy_team_id" uuid NOT NULL,
	"sportmonks_player_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_fantasy_team_player" UNIQUE("fantasy_team_id","sportmonks_player_id")
);
--> statement-breakpoint
CREATE TABLE "fantasy_teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"match_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fantasy_votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"battle_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"vote" "fantasy_vote_option" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_fantasy_vote_battle_user" UNIQUE("battle_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "xp" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "fantasy_battles" ADD CONSTRAINT "fantasy_battles_creator_id_profiles_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fantasy_battles" ADD CONSTRAINT "fantasy_battles_team_a_id_fantasy_teams_id_fk" FOREIGN KEY ("team_a_id") REFERENCES "public"."fantasy_teams"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fantasy_battles" ADD CONSTRAINT "fantasy_battles_team_b_id_fantasy_teams_id_fk" FOREIGN KEY ("team_b_id") REFERENCES "public"."fantasy_teams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fantasy_battles" ADD CONSTRAINT "fantasy_battles_winner_team_id_fantasy_teams_id_fk" FOREIGN KEY ("winner_team_id") REFERENCES "public"."fantasy_teams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fantasy_notifications" ADD CONSTRAINT "fantasy_notifications_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fantasy_notifications" ADD CONSTRAINT "fantasy_notifications_battle_id_fantasy_battles_id_fk" FOREIGN KEY ("battle_id") REFERENCES "public"."fantasy_battles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fantasy_team_players" ADD CONSTRAINT "fantasy_team_players_fantasy_team_id_fantasy_teams_id_fk" FOREIGN KEY ("fantasy_team_id") REFERENCES "public"."fantasy_teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fantasy_teams" ADD CONSTRAINT "fantasy_teams_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fantasy_teams" ADD CONSTRAINT "fantasy_teams_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fantasy_votes" ADD CONSTRAINT "fantasy_votes_battle_id_fantasy_battles_id_fk" FOREIGN KEY ("battle_id") REFERENCES "public"."fantasy_battles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fantasy_votes" ADD CONSTRAINT "fantasy_votes_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;