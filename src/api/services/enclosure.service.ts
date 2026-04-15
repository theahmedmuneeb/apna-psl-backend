import { db } from '@/db'
import { enclosures } from '@/db/schema'
import { asc, eq } from 'drizzle-orm'
import type { CreateEnclosureInput, UpdateEnclosureInput } from '@/api/schemas/enclosure.schema'

export const getEnclosuresByStadium = async (stadiumId: string) => {
    return db.select().from(enclosures).where(eq(enclosures.stadiumId, stadiumId)).orderBy(asc(enclosures.name)).execute()
}

export const getEnclosureById = async (id: string) => {
    const [enc] = await db.select().from(enclosures).where(eq(enclosures.id, id)).limit(1).execute()
    return enc ?? null
}

export const createEnclosure = async (data: CreateEnclosureInput) => {
    const [enc] = await db.insert(enclosures).values({
        stadiumId: data.stadiumId,
        name: data.name,
        enclosureCategoryId: data.enclosureCategoryId,
        config: data.config ?? null,
    }).returning().execute()
    return enc
}

export const updateEnclosure = async (id: string, data: UpdateEnclosureInput) => {
    const updateData: Record<string, unknown> = { updatedAt: new Date() }
    if (data.name !== undefined) updateData.name = data.name
    if (data.enclosureCategoryId !== undefined) updateData.enclosureCategoryId = data.enclosureCategoryId
    if (data.config !== undefined) updateData.config = data.config

    const [enc] = await db
        .update(enclosures)
        .set(updateData)
        .where(eq(enclosures.id, id))
        .returning()
        .execute()
    return enc ?? null
}

export const deleteEnclosure = async (id: string) => {
    const [enc] = await db.delete(enclosures).where(eq(enclosures.id, id)).returning().execute()
    return enc ?? null
}
