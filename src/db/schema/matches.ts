import { integer, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core'
import { teams } from './teams'
import { stadiums } from './stadiums'

export const matches = pgTable('matches', {
    id: uuid('id').defaultRandom().primaryKey(),
    sportmonksMatchId: integer('sportmonks_match_id'),
    teamAId: uuid('team_a_id').notNull().references(() => teams.id, { onDelete: 'restrict' }),
    teamBId: uuid('team_b_id').notNull().references(() => teams.id, { onDelete: 'restrict' }),
    stadiumId: uuid('stadium_id').notNull().references(() => stadiums.id, { onDelete: 'restrict' }),
    startTime: timestamp('start_time', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})
