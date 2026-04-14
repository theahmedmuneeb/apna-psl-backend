import { db } from '@/db'
import { profiles } from '@/db/schema'
import { eq } from 'drizzle-orm'

export type LinkedWallet = {
    profileId: string
    walletAddress: string | null
}

export const setUserWalletAddress = async (
    userId: string,
    walletAddress: string,
): Promise<LinkedWallet> => {
    const [updatedProfile] = await db
        .update(profiles)
        .set({
            walletAddress,
            updatedAt: new Date(),
        })
        .where(eq(profiles.id, userId))
        .returning({
            profileId: profiles.id,
            walletAddress: profiles.walletAddress,
        })
        .execute()

    if (!updatedProfile || !updatedProfile.walletAddress) {
        throw new Error('Profile not found while linking wallet')
    }

    return {
        profileId: updatedProfile.profileId,
        walletAddress: updatedProfile.walletAddress,
    }
}

export const unsetUserWalletAddress = async (
    userId: string,
): Promise<LinkedWallet> => {
    const [updatedProfile] = await db
        .update(profiles)
        .set({
            walletAddress: null,
            updatedAt: new Date(),
        })
        .where(eq(profiles.id, userId))
        .returning({
            profileId: profiles.id,
            walletAddress: profiles.walletAddress,
        })
        .execute()

    if (!updatedProfile) {
        throw new Error('Profile not found while unlinking wallet')
    }

    return {
        profileId: updatedProfile.profileId,
        walletAddress: updatedProfile.walletAddress,
    }
}