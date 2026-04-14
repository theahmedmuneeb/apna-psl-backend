import { boolean, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'
import { authUsers } from './users.auth'

export const stories = pgTable('stories', {
    id: uuid('id').defaultRandom().primaryKey(),
    title: varchar('title', { length: 255 }).notNull(),
    content: text('content').notNull(),
    thumbnail: varchar('thumbnail', { length: 1000 }).notNull(),
    isFeatured: boolean('is_featured').default(false).notNull(),
    createdById: uuid('created_by_id').references(() => authUsers.id, { onDelete: 'set null' }),
    updatedById: uuid('updated_by_id').references(() => authUsers.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})
