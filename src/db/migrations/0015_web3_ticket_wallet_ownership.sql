ALTER TABLE "tickets" ADD COLUMN "wallet_address" varchar(42);
--> statement-breakpoint
UPDATE "tickets" AS t
SET "wallet_address" = lower(coalesce(p."wallet_address", ''))
FROM "profiles" AS p
WHERE t."owner_id" = p."id";
--> statement-breakpoint
UPDATE "tickets"
SET "wallet_address" = '0x0000000000000000000000000000000000000000'
WHERE "wallet_address" IS NULL OR "wallet_address" = '';
--> statement-breakpoint
ALTER TABLE "tickets" ALTER COLUMN "wallet_address" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "tickets" ALTER COLUMN "owner_id" DROP NOT NULL;
--> statement-breakpoint
CREATE TABLE "sync_state" (
	"key" varchar(120) PRIMARY KEY NOT NULL,
	"last_synced_block" bigint DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
INSERT INTO "sync_state" ("key", "last_synced_block")
VALUES ('ticket_transfer_sync', 0)
ON CONFLICT ("key") DO NOTHING;
