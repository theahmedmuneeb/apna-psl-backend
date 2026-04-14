import { db } from '@/db'
import { teams } from '@/db/schema'
import { asc, eq } from 'drizzle-orm'
import { toSupabasePublicUrl } from '@/lib/supabase/public-url'

export type TeamListItem = {
    id: string
    name: string
    short: string
    logo: string | null
}

export const getAllTeams = async (): Promise<TeamListItem[]> => {
    const rows = await db
        .select({
            id: teams.id,
            name: teams.name,
            short: teams.shortName,
            logo: teams.logoUrl,
        })
        .from(teams)
        .orderBy(asc(teams.name))
        .execute()

    return rows.map((team) => ({
        ...team,
        logo: toSupabasePublicUrl(team.logo),
    }))
}

export const getTeamById = async (teamId: string): Promise<TeamListItem | null> => {
    const [team] = await db
        .select({
            id: teams.id,
            name: teams.name,
            short: teams.shortName,
            logo: teams.logoUrl,
        })
        .from(teams)
        .where(eq(teams.id, teamId))
        .limit(1)
        .execute()

    if (!team) {
        return null
    }

    return {
        ...team,
        logo: toSupabasePublicUrl(team.logo),
    }
}
