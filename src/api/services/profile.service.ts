import { db } from "@/db"
import { profiles, teams } from "../../db/schema"
import { eq } from "drizzle-orm"
import type { CreateProfileInput, EditProfileInput } from "@/api/schemas"
import { toSupabasePublicUrl } from "@/lib/supabase/public-url"

type ProfileRow = typeof profiles.$inferSelect
type TeamRow = typeof teams.$inferSelect

export type ProfileTeam = Pick<TeamRow, 'id' | 'name'> & {
    short: TeamRow['shortName']
    logo: TeamRow['logoUrl']
}

export type UserProfile = Pick<
    ProfileRow,
    'id' | 'cnic' | 'fullName' | 'dateOfBirth' | 'gender' | 'city' | 'address'
> & {
    team: ProfileTeam | null
} & {
    wallet: string | null
}

export type CreateUserProfileInput = CreateProfileInput & {
    fullName: string
}

export type EditUserProfileInput = EditProfileInput

export const getUserProfileById = async (userId: string): Promise<UserProfile | null> => {
    const profile = await db.select({
        id: profiles.id,
        cnic: profiles.cnic,
        fullName: profiles.fullName,
        dateOfBirth: profiles.dateOfBirth,
        gender: profiles.gender,
        city: profiles.city,
        address: profiles.address,
        walletAddress: profiles.walletAddress,
        teamId: teams.id,
        teamName: teams.name,
        teamShort: teams.shortName,
        teamLogo: teams.logoUrl,
    })
        .from(profiles)
        .leftJoin(teams, eq(profiles.teamId, teams.id))
        .where(eq(profiles.id, userId))
        .limit(1)
        .execute()

    if (!profile[0]) {
        return null
    }

    const row = profile[0]

    return {
        id: row.id,
        cnic: row.cnic,
        fullName: row.fullName,
        dateOfBirth: row.dateOfBirth,
        gender: row.gender,
        city: row.city,
        address: row.address,
        wallet: row.walletAddress || null,
        team: row.teamId
            ? {
                id: row.teamId,
                name: row.teamName!,
                short: row.teamShort!,
                logo: toSupabasePublicUrl(row.teamLogo),
            }
            : null,
    }
}

export const createUserProfile = async (
    userId: string,
    input: CreateUserProfileInput,
): Promise<UserProfile> => {
    const [profile] = await db.insert(profiles)
        .values({
            id: userId,
            fullName: input.fullName,
            cnic: input.cnic,
            dateOfBirth: input.dateOfBirth,
            gender: input.gender,
            city: input.city,
            address: input.address,
        })
        .returning({
            id: profiles.id,
            cnic: profiles.cnic,
            fullName: profiles.fullName,
            dateOfBirth: profiles.dateOfBirth,
            gender: profiles.gender,
            city: profiles.city,
            address: profiles.address,
            walletAddress: profiles.walletAddress,
        })
        .execute()

    return {
        ...profile,
        team: null,
        wallet: profile.walletAddress || null,
    }
}

export const setUserProfileTeam = async (
    userId: string,
    teamId: string,
): Promise<UserProfile> => {
    await db
        .update(profiles)
        .set({
            teamId,
            updatedAt: new Date(),
        })
        .where(eq(profiles.id, userId))
        .execute()

    const updatedProfile = await getUserProfileById(userId)

    if (!updatedProfile) {
        throw new Error('Profile not found after team update')
    }

    return updatedProfile
}

export const editUserProfile = async (
    userId: string,
    input: EditUserProfileInput,
): Promise<UserProfile> => {
    await db
        .update(profiles)
        .set({
            ...input,
            updatedAt: new Date(),
        })
        .where(eq(profiles.id, userId))
        .execute()

    const updatedProfile = await getUserProfileById(userId)

    if (!updatedProfile) {
        throw new Error('Profile not found after update')
    }

    return updatedProfile
}