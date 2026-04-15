import { db } from '@/db'
import { stadiums } from '@/db/schema'
import { asc, eq } from 'drizzle-orm'
import type { CreateStadiumInput, UpdateStadiumInput } from '@/api/schemas/stadium.schema'

export const getAllStadiums = async () => {
    return db.select().from(stadiums).orderBy(asc(stadiums.name)).execute()
}

export const getStadiumById = async (id: string) => {
    const [stadium] = await db.select().from(stadiums).where(eq(stadiums.id, id)).limit(1).execute()
    return stadium ?? null
}

export const createStadium = async (data: CreateStadiumInput) => {
    const [stadium] = await db.insert(stadiums).values(data).returning().execute()
    return stadium
}

export const updateStadium = async (id: string, data: UpdateStadiumInput) => {
    const [stadium] = await db
        .update(stadiums)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(stadiums.id, id))
        .returning()
        .execute()
    return stadium ?? null
}

export const deleteStadium = async (id: string) => {
    const [stadium] = await db.delete(stadiums).where(eq(stadiums.id, id)).returning().execute()
    return stadium ?? null
}
