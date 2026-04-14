import {
    date,
    pgEnum,
    pgTable,
    text,
    timestamp,
    uuid,
    varchar,
} from 'drizzle-orm/pg-core'
import { authUsers } from './users.auth'
import { teams } from './teams'

export const profileGenderEnum = pgEnum('profile_gender', [
    'male',
    'female',
    'other',
    'prefer_not_to_say',
])

export const profiles = pgTable('profiles', {
    id: uuid('id').primaryKey().references(() => authUsers.id, { onDelete: 'cascade' }),
    teamId: uuid('team_id').references(() => teams.id, { onDelete: 'set null' }),
    walletAddress: varchar('wallet_address', { length: 42 }),
    fullName: varchar('full_name', { length: 240 }).notNull(),
    cnic: varchar('cnic', { length: 15 }).notNull().unique(),
    dateOfBirth: date('date_of_birth'),
    gender: profileGenderEnum('gender'),
    city: varchar('city', { length: 80 }),
    address: text('address'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})