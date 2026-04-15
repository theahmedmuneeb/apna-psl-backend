import { db } from '@/db'
import { matches, teams, stadiums } from '@/db/schema'
import { eq, desc, sql } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { env } from '@/env'
import { psl } from '@/lib/sportmonks'
import type { CreateMatchInput, UpdateMatchInput } from '@/api/schemas/match.schema'

const teamA = alias(teams, 'teamA')
const teamB = alias(teams, 'teamB')

const formatLogoUrl = (url: string | null) => {
    if (!url) return null
    if (url.startsWith('http')) return url
    return `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${env.SUPABASE_STORAGE_BUCKET}/${url}`
}

const formatMatchResponse = (match: any, smTeamsMap: Map<number, any>) => {
    const smTeamA = smTeamsMap.get(match.teamA.sportmonksTeamId)
    const smTeamB = smTeamsMap.get(match.teamB.sportmonksTeamId)

    return {
        ...match,
        teamA: {
            ...match.teamA,
            logoUrl: smTeamA?.image_path || formatLogoUrl(match.teamA.logoUrl),
        },
        teamB: {
            ...match.teamB,
            logoUrl: smTeamB?.image_path || formatLogoUrl(match.teamB.logoUrl),
        },
    }
}

export const getAllMatches = async () => {
    const data = await db
        .select({
            id: matches.id,
            sportmonksMatchId: matches.sportmonksMatchId,
            startTime: matches.startTime,
            createdAt: matches.createdAt,
            availableTickets: sql<number>`(
                SELECT (
                    SELECT COUNT(*)::int
                    FROM seats s
                    INNER JOIN enclosures e ON e.id = s.enclosure_id
                    WHERE e.stadium_id = ${matches.stadiumId} AND s.is_active = true
                ) - (
                    SELECT COUNT(*)::int
                    FROM tickets t
                    WHERE t.match_id = ${matches.id} AND t.status IN ('valid', 'used')
                )
            )`.mapWith(Number),
            teamA: {
                id: teamA.id,
                name: teamA.name,
                shortName: teamA.shortName,
                logoUrl: teamA.logoUrl,
                sportmonksTeamId: teamA.sportmonksTeamId,
            },
            teamB: {
                id: teamB.id,
                name: teamB.name,
                shortName: teamB.shortName,
                logoUrl: teamB.logoUrl,
                sportmonksTeamId: teamB.sportmonksTeamId,
            },
            stadium: {
                id: stadiums.id,
                name: stadiums.name,
                location: stadiums.location,
            },
            enclosures: sql<any[]>`(
                SELECT json_agg(json_build_object(
                    'id', e.id,
                    'name', e.name,
                    'availableTickets', (
                        SELECT COUNT(*)::int
                        FROM seats s
                        WHERE s.enclosure_id = e.id AND s.is_active = true
                    ) - (
                        SELECT COUNT(*)::int
                        FROM tickets t
                        WHERE t.match_id = ${matches.id} 
                        AND t.seat_id IN (SELECT id FROM seats WHERE enclosure_id = e.id)
                        AND t.status IN ('valid', 'used')
                    )
                ))
                FROM enclosures e
                WHERE e.stadium_id = ${matches.stadiumId}
            )`.mapWith((val) => val || []),
        })
        .from(matches)
        .innerJoin(teamA, eq(matches.teamAId, teamA.id))
        .innerJoin(teamB, eq(matches.teamBId, teamB.id))
        .innerJoin(stadiums, eq(matches.stadiumId, stadiums.id))
        .orderBy(desc(matches.startTime))
        .execute()
        
    const seasonData = await psl.seasonTeams().then(res => res.data).catch(() => null)
    const smTeams = seasonData?.teams || []
    
    const smTeamsMap = new Map()
    smTeams.forEach((t: any) => smTeamsMap.set(t.id, t))

    return data.map((m) => formatMatchResponse(m, smTeamsMap))
}

export const getMatchById = async (id: string) => {
    const [match] = await db
        .select({
            id: matches.id,
            sportmonksMatchId: matches.sportmonksMatchId,
            startTime: matches.startTime,
            createdAt: matches.createdAt,
            availableTickets: sql<number>`(
                SELECT (
                    SELECT COUNT(*)::int
                    FROM seats s
                    INNER JOIN enclosures e ON e.id = s.enclosure_id
                    WHERE e.stadium_id = ${matches.stadiumId} AND s.is_active = true
                ) - (
                    SELECT COUNT(*)::int
                    FROM tickets t
                    WHERE t.match_id = ${matches.id} AND t.status IN ('valid', 'used')
                )
            )`.mapWith(Number),
            teamA: {
                id: teamA.id,
                name: teamA.name,
                shortName: teamA.shortName,
                logoUrl: teamA.logoUrl,
                sportmonksTeamId: teamA.sportmonksTeamId,
            },
            teamB: {
                id: teamB.id,
                name: teamB.name,
                shortName: teamB.shortName,
                logoUrl: teamB.logoUrl,
                sportmonksTeamId: teamB.sportmonksTeamId,
            },
            stadium: {
                id: stadiums.id,
                name: stadiums.name,
                location: stadiums.location,
            },
            enclosures: sql<any[]>`(
                SELECT json_agg(json_build_object(
                    'id', e.id,
                    'name', e.name,
                    'availableTickets', (
                        SELECT COUNT(*)::int
                        FROM seats s
                        WHERE s.enclosure_id = e.id AND s.is_active = true
                    ) - (
                        SELECT COUNT(*)::int
                        FROM tickets t
                        WHERE t.match_id = ${matches.id} 
                        AND t.seat_id IN (SELECT id FROM seats WHERE enclosure_id = e.id)
                        AND t.status IN ('valid', 'used')
                    )
                ))
                FROM enclosures e
                WHERE e.stadium_id = ${matches.stadiumId}
            )`.mapWith((val) => val || []),
        })
        .from(matches)
        .innerJoin(teamA, eq(matches.teamAId, teamA.id))
        .innerJoin(teamB, eq(matches.teamBId, teamB.id))
        .innerJoin(stadiums, eq(matches.stadiumId, stadiums.id))
        .where(eq(matches.id, id))
        .limit(1)
        .execute()
        
    if (!match) return null

    const seasonData = await psl.seasonTeams().then(res => res.data).catch(() => null)
    const smTeams = seasonData?.teams || []
    
    const smTeamsMap = new Map()
    smTeams.forEach((t: any) => smTeamsMap.set(t.id, t))

    return formatMatchResponse(match, smTeamsMap)
}

export const createMatch = async (data: CreateMatchInput) => {
    const [match] = await db
        .insert(matches)
        .values({
            sportmonksMatchId: data.sportmonksMatchId ?? null,
            teamAId: data.teamAId,
            teamBId: data.teamBId,
            stadiumId: data.stadiumId,
            startTime: new Date(data.startTime),
        })
        .returning()
        .execute()
    return match
}

export const updateMatch = async (id: string, data: UpdateMatchInput) => {
    const updateData: Record<string, unknown> = { updatedAt: new Date() }
    if (data.teamAId !== undefined) updateData.teamAId = data.teamAId
    if (data.teamBId !== undefined) updateData.teamBId = data.teamBId
    if (data.stadiumId !== undefined) updateData.stadiumId = data.stadiumId
    if (data.startTime !== undefined) updateData.startTime = new Date(data.startTime)

    const [match] = await db
        .update(matches)
        .set(updateData)
        .where(eq(matches.id, id))
        .returning()
        .execute()
    return match ?? null
}

export const deleteMatch = async (id: string) => {
    const [match] = await db.delete(matches).where(eq(matches.id, id)).returning().execute()
    return match ?? null
}
