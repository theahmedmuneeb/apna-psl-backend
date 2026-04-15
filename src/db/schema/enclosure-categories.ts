import { pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'

export const enclosureCategories = pgTable('enclosure_categories', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 100 }).notNull().unique(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})
