import { numeric, pgEnum, pgTable, timestamp, unique, uuid } from 'drizzle-orm/pg-core'
import { matches } from './matches'
import { enclosureCategories } from './enclosure-categories'

export const currencyEnum = pgEnum('pricing_currency', ['WIRE', 'PSL'])

export const matchPricing = pgTable('match_pricing', {
    id: uuid('id').defaultRandom().primaryKey(),
    matchId: uuid('match_id').notNull().references(() => matches.id, { onDelete: 'cascade' }),
    enclosureCategoryId: uuid('enclosure_category_id').notNull().references(() => enclosureCategories.id, { onDelete: 'restrict' }),
    price: numeric('price', { precision: 18, scale: 6 }).notNull(),
    currency: currencyEnum('currency').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
    unique('uq_match_category_currency').on(t.matchId, t.enclosureCategoryId, t.currency),
])
