import { db } from '@/db'
import { stories } from '@/db/schema'
import { desc, eq } from 'drizzle-orm'
import { toSupabasePublicUrl } from '@/lib/supabase/public-url'
import { createSupabaseAdminClient } from '@/lib/supabase'
import { env } from '@/env'

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

function sanitizeFileName(fileName: string) {
    return fileName
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9._-]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
}

function isStoragePath(value: string) {
    return !/^https?:\/\//i.test(value)
}

function isContentEmpty(content: string) {
    return content.replace(/<(.|\n)*?>/g, '').trim().length === 0
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

export const createStory = async (data: {
    title: string
    content: string
    isFeatured: boolean
    thumbnailFile: File
    userId: string
}) => {
    if (!data.title.trim() || isContentEmpty(data.content)) {
        throw new Error('Title and content are required.')
    }

    const supabaseAdmin = createSupabaseAdminClient()
    const fileExtension = data.thumbnailFile.name.includes('.')
        ? data.thumbnailFile.name.split('.').pop()
        : 'jpg'
    const fileName = `${Date.now()}-${sanitizeFileName(data.title)}.${fileExtension}`
    const filePath = `story-thumbnails/${fileName}`

    const { error: uploadError } = await supabaseAdmin.storage
        .from(env.SUPABASE_STORAGE_BUCKET)
        .upload(filePath, Buffer.from(await data.thumbnailFile.arrayBuffer()), {
            contentType: data.thumbnailFile.type || 'image/jpeg',
            upsert: false,
        })

    if (uploadError) {
        throw new Error(uploadError.message)
    }

    const [story] = await db.insert(stories).values({
        title: data.title,
        thumbnail: filePath,
        content: data.content,
        isFeatured: data.isFeatured,
        createdById: data.userId,
        updatedById: data.userId,
    }).returning().execute()

    return story
}

export const updateStory = async (storyId: string, data: {
    title: string
    content: string
    isFeatured: boolean
    thumbnailFile?: File | null
    userId: string
}) => {
    if (!data.title.trim() || isContentEmpty(data.content)) {
        throw new Error('Title and content are required.')
    }

    const [existingStory] = await db
        .select({ thumbnail: stories.thumbnail })
        .from(stories)
        .where(eq(stories.id, storyId))
        .limit(1)

    if (!existingStory) return null

    let nextThumbnail = existingStory.thumbnail

    if (data.thumbnailFile && data.thumbnailFile.size > 0) {
        const supabaseAdmin = createSupabaseAdminClient()
        const fileExtension = data.thumbnailFile.name.includes('.')
            ? data.thumbnailFile.name.split('.').pop()
            : 'jpg'
        const fileName = `${Date.now()}-${sanitizeFileName(data.title)}.${fileExtension}`
        const filePath = `story-thumbnails/${fileName}`

        const { error: uploadError } = await supabaseAdmin.storage
            .from(env.SUPABASE_STORAGE_BUCKET)
            .upload(filePath, Buffer.from(await data.thumbnailFile.arrayBuffer()), {
                contentType: data.thumbnailFile.type || 'image/jpeg',
                upsert: false,
            })

        if (uploadError) {
            throw new Error(uploadError.message)
        }

        if (isStoragePath(existingStory.thumbnail)) {
            await supabaseAdmin.storage
                .from(env.SUPABASE_STORAGE_BUCKET)
                .remove([existingStory.thumbnail])
        }

        nextThumbnail = filePath
    }

    const [story] = await db
        .update(stories)
        .set({
            title: data.title,
            thumbnail: nextThumbnail,
            content: data.content,
            isFeatured: data.isFeatured,
            updatedById: data.userId,
            updatedAt: new Date(),
        })
        .where(eq(stories.id, storyId))
        .returning()
        .execute()

    return story ?? null
}

export const deleteStory = async (storyId: string) => {
    const [story] = await db
        .select({ thumbnail: stories.thumbnail })
        .from(stories)
        .where(eq(stories.id, storyId))
        .limit(1)

    if (!story) return null

    if (story.thumbnail && isStoragePath(story.thumbnail)) {
        const supabaseAdmin = createSupabaseAdminClient()
        await supabaseAdmin.storage
            .from(env.SUPABASE_STORAGE_BUCKET)
            .remove([story.thumbnail])
    }

    const [deleted] = await db.delete(stories).where(eq(stories.id, storyId)).returning().execute()
    return deleted ?? null
}
