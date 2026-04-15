import { db } from '@/db'
import { profiles, tickets } from '@/db/schema'
import { eq } from 'drizzle-orm'

export type LinkedWallet = {
    profileId: string
    walletAddress: string | null
}

export const setUserWalletAddress = async (
    userId: string,
    walletAddress: string,
): Promise<LinkedWallet> => {
    const normalizedWalletAddress = walletAddress.toLowerCase()

    const [updatedProfile] = await db
        .update(profiles)
        .set({
            walletAddress: normalizedWalletAddress,
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

    // Lazy association: attach tickets already owned by this wallet to the current profile.
    await db
        .update(tickets)
        .set({
            ownerId: userId,
            updatedAt: new Date(),
        })
        .where(eq(tickets.walletAddress, normalizedWalletAddress))
        .execute()

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