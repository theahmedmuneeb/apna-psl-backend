import { db } from '@/db'
import { enclosureCategories } from '@/db/schema'
import { asc, eq } from 'drizzle-orm'
import type { CreateEnclosureCategoryInput, UpdateEnclosureCategoryInput } from '@/api/schemas/enclosure.schema'

export const getAllEnclosureCategories = async () => {
    return db.select().from(enclosureCategories).orderBy(asc(enclosureCategories.name)).execute()
}

export const getEnclosureCategoryById = async (id: string) => {
    const [cat] = await db.select().from(enclosureCategories).where(eq(enclosureCategories.id, id)).limit(1).execute()
    return cat ?? null
}

export const createEnclosureCategory = async (data: CreateEnclosureCategoryInput) => {
    const [cat] = await db.insert(enclosureCategories).values(data).returning().execute()
    return cat
}

export const updateEnclosureCategory = async (id: string, data: UpdateEnclosureCategoryInput) => {
    const [cat] = await db
        .update(enclosureCategories)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(enclosureCategories.id, id))
        .returning()
        .execute()
    return cat ?? null
}

export const deleteEnclosureCategory = async (id: string) => {
    const [cat] = await db.delete(enclosureCategories).where(eq(enclosureCategories.id, id)).returning().execute()
    return cat ?? null
}
