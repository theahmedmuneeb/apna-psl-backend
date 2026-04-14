import { db } from '@/db'
import { stories } from '@/db/schema'
import { desc, eq } from 'drizzle-orm'
import { toSupabasePublicUrl } from '@/lib/supabase/public-url'

export type StoryListItem = {
    id: string
    title: string
    content: string
    thumbnail: string
    isFeatured: boolean
    createdById: string | null
    updatedById: string | null
    createdAt: Date
    updatedAt: Date
}

type ListStoriesOptions = {
    featuredOnly?: boolean
    limit?: number
}

export const listStories = async (
    options: ListStoriesOptions = {},
): Promise<StoryListItem[]> => {
    const baseQuery = db
        .select({
            id: stories.id,
            title: stories.title,
            content: stories.content,
            thumbnail: stories.thumbnail,
            isFeatured: stories.isFeatured,
            createdById: stories.createdById,
            updatedById: stories.updatedById,
            createdAt: stories.createdAt,
            updatedAt: stories.updatedAt,
        })
        .from(stories)
        .orderBy(desc(stories.createdAt))

    const query =
        options.featuredOnly === true
            ? baseQuery.where(eq(stories.isFeatured, true))
            : baseQuery

    const rows =
        typeof options.limit === 'number' && options.limit > 0
            ? await query.limit(options.limit).execute()
            : await query.execute()

    return rows.map((row) => ({
        ...row,
        thumbnail: toSupabasePublicUrl(row.thumbnail) ?? row.thumbnail,
    }))
}

export const getStoryById = async (storyId: string): Promise<StoryListItem | null> => {
    const [story] = await db
        .select({
            id: stories.id,
            title: stories.title,
            content: stories.content,
            thumbnail: stories.thumbnail,
            isFeatured: stories.isFeatured,
            createdById: stories.createdById,
            updatedById: stories.updatedById,
            createdAt: stories.createdAt,
            updatedAt: stories.updatedAt,
        })
        .from(stories)
        .where(eq(stories.id, storyId))
        .limit(1)
        .execute()

    if (!story) {
        return null
    }

    return {
        ...story,
        thumbnail: toSupabasePublicUrl(story.thumbnail) ?? story.thumbnail,
    }
}
