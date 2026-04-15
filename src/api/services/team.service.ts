import { db } from '@/db'
import { teams } from '@/db/schema'
import { asc, desc, eq } from 'drizzle-orm'
import { toSupabasePublicUrl } from '@/lib/supabase/public-url'
import { createSupabaseAdminClient } from '@/lib/supabase'
import { env } from '@/env'

export type TeamListItem = {
    id: string
    name: string
    short: string
    logo: string | null
    sportmonksTeamId: number
}

function sanitizeFileName(fileName: string) {
    return fileName
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9._-]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
}

export const getAllTeams = async (opts?: { includePlaceholders?: boolean }): Promise<TeamListItem[]> => {
    const baseQuery = db
        .select({
            id: teams.id,
            name: teams.name,
            short: teams.shortName,
            logo: teams.logoUrl,
            sportmonksTeamId: teams.sportmonksTeamId,
        })
        .from(teams)
        .orderBy(asc(teams.name))

    const query = opts?.includePlaceholders
        ? baseQuery
        : baseQuery.where(eq(teams.isPlaceholder, false))

    const rows = await query.execute()

    return rows.map((team) => ({
        ...team,
        logo: toSupabasePublicUrl(team.logo),
    }))
}

export const getAllTeamsRaw = async () => {
    return db.select().from(teams).orderBy(desc(teams.createdAt)).execute()
}

export const getTeamById = async (teamId: string): Promise<TeamListItem | null> => {
    const [team] = await db
        .select({
            id: teams.id,
            name: teams.name,
            short: teams.shortName,
            logo: teams.logoUrl,
            sportmonksTeamId: teams.sportmonksTeamId,
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

export const createTeam = async (data: {
    name: string
    shortName: string
    sportmonksTeamId: number
    logoFile?: File | null
    isPlaceholder?: boolean
}) => {
    let filePath: string | null = null

    if (data.logoFile && data.logoFile.size > 0) {
        const supabaseAdmin = createSupabaseAdminClient()
        const fileExtension = data.logoFile.name.includes('.')
            ? data.logoFile.name.split('.').pop()
            : 'png'
        const fileName = `${Date.now()}-${sanitizeFileName(data.shortName)}.${fileExtension}`
        filePath = `team-logos/${fileName}`

        const { error: uploadError } = await supabaseAdmin.storage
            .from(env.SUPABASE_STORAGE_BUCKET)
            .upload(filePath, Buffer.from(await data.logoFile.arrayBuffer()), {
                contentType: data.logoFile.type || 'image/png',
                upsert: false,
            })

        if (uploadError) {
            throw new Error(uploadError.message)
        }
    }

    const [team] = await db.insert(teams).values({
        name: data.name,
        shortName: data.shortName,
        sportmonksTeamId: data.sportmonksTeamId,
        logoUrl: filePath,
        isPlaceholder: data.isPlaceholder ?? false,
    }).returning().execute()

    return team
}

export const updateTeam = async (teamId: string, data: {
    name: string
    shortName: string
    sportmonksTeamId: number
    logoFile?: File | null
}) => {
    const supabaseAdmin = createSupabaseAdminClient()
    const [existingTeam] = await db
        .select({ id: teams.id, logoUrl: teams.logoUrl })
        .from(teams)
        .where(eq(teams.id, teamId))
        .limit(1)

    if (!existingTeam) return null

    let nextLogoPath: string | null = existingTeam.logoUrl

    if (data.logoFile && data.logoFile.size > 0) {
        const fileExtension = data.logoFile.name.includes('.')
            ? data.logoFile.name.split('.').pop()
            : 'png'
        const fileName = `${Date.now()}-${sanitizeFileName(data.shortName)}.${fileExtension}`
        const filePath = `team-logos/${fileName}`

        const { error: uploadError } = await supabaseAdmin.storage
            .from(env.SUPABASE_STORAGE_BUCKET)
            .upload(filePath, Buffer.from(await data.logoFile.arrayBuffer()), {
                contentType: data.logoFile.type || 'image/png',
                upsert: false,
            })

        if (uploadError) {
            throw new Error(uploadError.message)
        }

        nextLogoPath = filePath

        // Delete old logo
        if (existingTeam.logoUrl && existingTeam.logoUrl !== nextLogoPath) {
            await supabaseAdmin.storage
                .from(env.SUPABASE_STORAGE_BUCKET)
                .remove([existingTeam.logoUrl])
        }
    }

    const [team] = await db
        .update(teams)
        .set({
            name: data.name,
            shortName: data.shortName,
            sportmonksTeamId: data.sportmonksTeamId,
            logoUrl: nextLogoPath,
            updatedAt: new Date(),
        })
        .where(eq(teams.id, teamId))
        .returning()
        .execute()

    return team ?? null
}

export const deleteTeam = async (teamId: string) => {
    const supabaseAdmin = createSupabaseAdminClient()
    const [team] = await db
        .select({ id: teams.id, logoUrl: teams.logoUrl })
        .from(teams)
        .where(eq(teams.id, teamId))
        .limit(1)

    if (!team) return null

    if (team.logoUrl) {
        await supabaseAdmin.storage
            .from(env.SUPABASE_STORAGE_BUCKET)
            .remove([team.logoUrl])
    }

    const [deleted] = await db.delete(teams).where(eq(teams.id, teamId)).returning().execute()
    return deleted ?? null
}
