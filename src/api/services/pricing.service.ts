import { db } from '@/db'
import { matchPricing, enclosureCategories } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import type { CreatePricingInput, UpdatePricingInput } from '@/api/schemas/pricing.schema'

export const getPricingByMatch = async (matchId: string) => {
    return db
        .select({
            id: matchPricing.id,
            matchId: matchPricing.matchId,
            enclosureCategoryId: matchPricing.enclosureCategoryId,
            categoryName: enclosureCategories.name,
            price: matchPricing.price,
            currency: matchPricing.currency,
            createdAt: matchPricing.createdAt,
        })
        .from(matchPricing)
        .innerJoin(enclosureCategories, eq(matchPricing.enclosureCategoryId, enclosureCategories.id))
        .where(eq(matchPricing.matchId, matchId))
        .execute()
}

export const createPricing = async (data: CreatePricingInput) => {
    const [pricing] = await db
        .insert(matchPricing)
        .values(data)
        .returning()
        .execute()
    return pricing
}

export const updatePricing = async (id: string, data: UpdatePricingInput) => {
    const [pricing] = await db
        .update(matchPricing)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(matchPricing.id, id))
        .returning()
        .execute()
    return pricing ?? null
}

export const deletePricing = async (id: string) => {
    const [pricing] = await db.delete(matchPricing).where(eq(matchPricing.id, id)).returning().execute()
    return pricing ?? null
}
