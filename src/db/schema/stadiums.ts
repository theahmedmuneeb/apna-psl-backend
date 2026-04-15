import { integer, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'

export const stadiums = pgTable('stadiums', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 200 }).notNull(),
    location: varchar('location', { length: 300 }).notNull(),
    sportmonksVenueId: integer('sportmonks_venue_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})
