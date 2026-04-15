import { pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'
import { profiles } from './profiles'
import { matches } from './matches'
import { seats } from './seats'

export const pendingTickets = pgTable('pending_tickets', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
    matchId: uuid('match_id').notNull().references(() => matches.id, { onDelete: 'cascade' }),
    seatId: uuid('seat_id').notNull().references(() => seats.id, { onDelete: 'cascade' }),
    matchIdBytes: varchar('match_id_bytes', { length: 66 }).notNull(),
    seatIdBytes: varchar('seat_id_bytes', { length: 66 }).notNull(),
    userAddress: varchar('user_address', { length: 42 }).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})
