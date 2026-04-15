import { jsonb, pgEnum, pgTable, timestamp, unique, uuid, varchar } from 'drizzle-orm/pg-core'
import { profiles } from './profiles'
import { matches } from './matches'
import { seats } from './seats'
import { enclosureCategories } from './enclosure-categories'

export const ticketStatusEnum = pgEnum('ticket_status', ['valid', 'used', 'cancelled', 'expired'])

export const tickets = pgTable('tickets', {
    id: uuid('id').defaultRandom().primaryKey(),
    ownerId: uuid('owner_id').notNull().references(() => profiles.id, { onDelete: 'restrict' }),
    matchId: uuid('match_id').notNull().references(() => matches.id, { onDelete: 'restrict' }),
    seatId: uuid('seat_id').notNull().references(() => seats.id, { onDelete: 'restrict' }),
    enclosureCategoryId: uuid('enclosure_category_id').notNull().references(() => enclosureCategories.id, { onDelete: 'restrict' }),
    nftContractAddress: varchar('nft_contract_address', { length: 42 }),
    nftTokenId: varchar('nft_token_id', { length: 78 }),
    nftMetadata: jsonb('nft_metadata').$type<Record<string, unknown>>(),
    status: ticketStatusEnum('status').notNull().default('valid'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
    unique('uq_ticket_seat_match').on(t.seatId, t.matchId),
    unique('uq_ticket_nft').on(t.nftContractAddress, t.nftTokenId),
])
