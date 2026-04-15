import { Hono } from 'hono'
import { getStoryById, listStories, createStory, updateStory, deleteStory } from '@/api/services/story.service'
import type { AppVariables } from '@/api/types/app'
import { apiError, apiSuccess } from '@/lib/api-response'
import { authMiddleware } from '@/api/middlewares/auth.middleware'
import { adminMiddleware } from '@/api/middlewares/admin.middleware'

export const storyRoute = new Hono<{ Variables: AppVariables }>()

// Public read endpoints (no auth needed for read, but keeping consistent)
storyRoute.get('/', async (c) => {
    const featuredOnly = c.req.query('featured') === 'true'
    const limitParam = c.req.query('limit')

    const parsedLimit = typeof limitParam === 'string' ? Number.parseInt(limitParam, 10) : undefined

    const stories = await listStories({
        featuredOnly,
        limit: Number.isFinite(parsedLimit) ? parsedLimit : undefined,
    })

    return apiSuccess(c, stories, {
        message: 'Stories fetched successfully',
    })
})

storyRoute.get('/:storyId', async (c) => {
    const storyId = c.req.param('storyId')

    if (!storyId) {
        return apiError(c, 'Story id is required', {
            statusCode: 400,
            error: 'STORY_ID_REQUIRED',
        })
    }

    const story = await getStoryById(storyId)

    if (!story) {
        return apiError(c, 'Story not found', {
            statusCode: 404,
            error: 'STORY_NOT_FOUND',
        })
    }

    return apiSuccess(c, story, {
        message: 'Story fetched successfully',
    })
})

// Admin-only write operations
storyRoute.post('/', authMiddleware, adminMiddleware, async (c) => {
    try {
        const body = await c.req.parseBody()
        const title = String(body['title'] ?? '').trim()
        const content = String(body['content'] ?? '')
        const isFeatured = String(body['isFeatured'] ?? 'false') === 'true'
        const thumbnailFile = body['thumbnailFile']
        const user = c.get('supabaseUser')

        if (!(thumbnailFile instanceof File) || thumbnailFile.size === 0) {
            return apiError(c, 'Thumbnail image is required', {
                statusCode: 400,
                error: 'VALIDATION_ERROR',
            })
        }

        const story = await createStory({
            title,
            content,
            isFeatured,
            thumbnailFile,
            userId: user.id,
        })
        return apiSuccess(c, story, { statusCode: 201, message: 'Story created' })
    } catch (err: any) {
        return apiError(c, err.message ?? 'Failed to create story', { statusCode: 500 })
    }
})

storyRoute.patch('/:storyId', authMiddleware, adminMiddleware, async (c) => {
    try {
        const storyId = c.req.param('storyId')
        const body = await c.req.parseBody()
        const title = String(body['title'] ?? '').trim()
        const content = String(body['content'] ?? '')
        const isFeatured = String(body['isFeatured'] ?? 'false') === 'true'
        const thumbnailFile = body['thumbnailFile']
        const user = c.get('supabaseUser')

        const story = await updateStory(storyId, {
            title,
            content,
            isFeatured,
            thumbnailFile: thumbnailFile instanceof File && thumbnailFile.size > 0 ? thumbnailFile : null,
            userId: user.id,
        })
        if (!story) return apiError(c, 'Story not found', { statusCode: 404, error: 'NOT_FOUND' })
        return apiSuccess(c, story, { message: 'Story updated' })
    } catch (err: any) {
        return apiError(c, err.message ?? 'Failed to update story', { statusCode: 500 })
    }
})

storyRoute.delete('/:storyId', authMiddleware, adminMiddleware, async (c) => {
    const story = await deleteStory(c.req.param('storyId'))
    if (!story) return apiError(c, 'Story not found', { statusCode: 404, error: 'NOT_FOUND' })
    return apiSuccess(c, story, { message: 'Story deleted' })
})
