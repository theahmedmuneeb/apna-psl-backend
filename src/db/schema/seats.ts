import { boolean, integer, pgTable, timestamp, unique, uuid, varchar } from 'drizzle-orm/pg-core'
import { enclosures } from './enclosures'

export const seats = pgTable('seats', {
    id: uuid('id').defaultRandom().primaryKey(),
    enclosureId: uuid('enclosure_id').notNull().references(() => enclosures.id, { onDelete: 'cascade' }),
    rowLabel: varchar('row_label', { length: 50 }).notNull(),
    seatNumber: integer('seat_number').notNull(),
    label: varchar('label', { length: 50 }).notNull(),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
    unique('uq_seat_enclosure_row_number').on(t.enclosureId, t.rowLabel, t.seatNumber),
])
