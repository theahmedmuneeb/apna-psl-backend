import { Hono } from 'hono'
import { apiSuccess, apiError } from '@/lib/api-response'
import type { AppVariables } from '@/api/types/app'
import { authMiddleware } from '@/api/middlewares/auth.middleware'
import { adminMiddleware } from '@/api/middlewares/admin.middleware'
import { psl } from '@/lib/sportmonks'
import { toPKTString } from '@/lib/utils'

export const sportmonksRoute = new Hono<{ Variables: AppVariables }>()

sportmonksRoute.use('*', authMiddleware, adminMiddleware)

sportmonksRoute.get('/fixtures', async (c) => {
    try {
        const result = await psl.fixtures()
        const formattedFixtures = result.data.map(f => ({ ...f, starting_at: toPKTString(f.starting_at) as string }))
        return apiSuccess(c, formattedFixtures, { message: 'Fixtures fetched' })
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
        if (result.data) {
            result.data.starting_at = toPKTString(result.data.starting_at) as string;
        }
        return apiSuccess(c, result.data, { message: 'Fixture fetched' })
    } catch (err: any) {
        return apiError(c, err.message ?? 'Failed to fetch fixture', {
            statusCode: err.status ?? 500,
            error: 'SPORTMONKS_ERROR',
        })
    }
})
