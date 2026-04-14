import { Hono } from 'hono'
import { getStoryById, listStories } from '@/api/services/story.service'
import type { AppVariables } from '@/api/types/app'
import { apiError, apiSuccess } from '@/lib/api-response'

export const storyRoute = new Hono<{ Variables: AppVariables }>()

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
