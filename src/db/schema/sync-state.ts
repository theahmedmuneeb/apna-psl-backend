import { bigint, pgTable, timestamp, varchar } from 'drizzle-orm/pg-core'

export const syncState = pgTable('sync_state', {
    key: varchar('key', { length: 120 }).primaryKey(),
    lastSyncedBlock: bigint('last_synced_block', { mode: 'number' }).notNull().default(0),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})
