import { Hono } from 'hono'
import { apiSuccess, apiError } from '@/lib/api-response'
import type { AppVariables } from '@/api/types/app'
import { authMiddleware } from '@/api/middlewares/auth.middleware'
import { adminMiddleware } from '@/api/middlewares/admin.middleware'
import { psl } from '@/lib/sportmonks'

export const sportmonksRoute = new Hono<{ Variables: AppVariables }>()

sportmonksRoute.use('*', authMiddleware, adminMiddleware)

sportmonksRoute.get('/fixtures', async (c) => {
    try {
        const result = await psl.fixtures()
        return apiSuccess(c, result.data, { message: 'Fixtures fetched' })
    } catch (err: any) {
        return apiError(c, err.message ?? 'Failed to fetch fixtures', {
            statusCode: err.status ?? 500,
            error: 'SPORTMONKS_ERROR',
        })
    }
})

sportmonksRoute.get('/fixtures/:id', async (c) => {
    try {
        const id = parseInt(c.req.param('id'), 10)
        if (isNaN(id)) return apiError(c, 'Invalid fixture ID', { statusCode: 400, error: 'INVALID_PARAM' })
        const result = await psl.fixtureById(id)
        return apiSuccess(c, result.data, { message: 'Fixture fetched' })
    } catch (err: any) {
        return apiError(c, err.message ?? 'Failed to fetch fixture', {
            statusCode: err.status ?? 500,
            error: 'SPORTMONKS_ERROR',
        })
    }
})
