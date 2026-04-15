import { Hono } from 'hono'
import { apiSuccess, apiError } from '@/lib/api-response'
import type { AppVariables } from '@/api/types/app'
import { authMiddleware } from '@/api/middlewares/auth.middleware'
import { adminMiddleware } from '@/api/middlewares/admin.middleware'
import { schemaValidator } from '@/api/middlewares/schemaValidator.middleware'
import { createStadiumSchema, updateStadiumSchema } from '@/api/schemas/stadium.schema'
import * as stadiumService from '@/api/services/stadium.service'

export const stadiumRoute = new Hono<{ Variables: AppVariables }>()

// All stadium routes require auth + admin
stadiumRoute.use('*', authMiddleware, adminMiddleware)

stadiumRoute.get('/', async (c) => {
    const stadiums = await stadiumService.getAllStadiums()
    return apiSuccess(c, stadiums, { message: 'Stadiums fetched successfully' })
})

stadiumRoute.get('/:id', async (c) => {
    const stadium = await stadiumService.getStadiumById(c.req.param('id'))
    if (!stadium) return apiError(c, 'Stadium not found', { statusCode: 404, error: 'NOT_FOUND' })
    return apiSuccess(c, stadium)
})

stadiumRoute.post('/', schemaValidator(createStadiumSchema), async (c) => {
    const data = c.get('validatedBody') as any
    const stadium = await stadiumService.createStadium(data)
    return apiSuccess(c, stadium, { statusCode: 201, message: 'Stadium created' })
})

stadiumRoute.patch('/:id', schemaValidator(updateStadiumSchema), async (c) => {
    const data = c.get('validatedBody') as any
    const stadium = await stadiumService.updateStadium(c.req.param('id'), data)
    if (!stadium) return apiError(c, 'Stadium not found', { statusCode: 404, error: 'NOT_FOUND' })
    return apiSuccess(c, stadium, { message: 'Stadium updated' })
})

stadiumRoute.delete('/:id', async (c) => {
    const stadium = await stadiumService.deleteStadium(c.req.param('id'))
    if (!stadium) return apiError(c, 'Stadium not found', { statusCode: 404, error: 'NOT_FOUND' })
    return apiSuccess(c, stadium, { message: 'Stadium deleted' })
})
