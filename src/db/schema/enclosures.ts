import { jsonb, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'
import { stadiums } from './stadiums'
import { enclosureCategories } from './enclosure-categories'

export const enclosures = pgTable('enclosures', {
    id: uuid('id').defaultRandom().primaryKey(),
    stadiumId: uuid('stadium_id').notNull().references(() => stadiums.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 200 }).notNull(),
    enclosureCategoryId: uuid('enclosure_category_id').notNull().references(() => enclosureCategories.id, { onDelete: 'restrict' }),
    config: jsonb('config').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})
