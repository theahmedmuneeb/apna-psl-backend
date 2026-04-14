import { integer, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'

export const teams = pgTable('teams', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 100 }).notNull().unique(),
    shortName: varchar('short_name', { length: 5 }).notNull().unique(),
    sportmonksTeamId: integer('sportmonks_team_id').notNull(),
    logoUrl: varchar('logo_url', { length: 255 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})