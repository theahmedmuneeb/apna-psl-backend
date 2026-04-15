import { Hono } from 'hono'
import { apiSuccess, apiError } from '@/lib/api-response'
import type { AppVariables } from '@/api/types/app'
import { authMiddleware } from '@/api/middlewares/auth.middleware'
import { adminMiddleware } from '@/api/middlewares/admin.middleware'
import { schemaValidator } from '@/api/middlewares/schemaValidator.middleware'
import { bulkCreateSeatsSchema, syncSeatsSchema, updateSeatSchema } from '@/api/schemas/seat.schema'
import * as seatService from '@/api/services/seat.service'

export const seatRoute = new Hono<{ Variables: AppVariables }>()

seatRoute.get('/', authMiddleware, async (c) => {
    const enclosureId = c.req.query('enclosureId')
    if (!enclosureId) return apiError(c, 'enclosureId query param required', { statusCode: 400, error: 'MISSING_PARAM' })
    const seats = await seatService.getSeatsByEnclosure(enclosureId)
    return apiSuccess(c, seats, { message: 'Seats fetched successfully' })
})

seatRoute.post('/bulk', authMiddleware, adminMiddleware, schemaValidator(bulkCreateSeatsSchema), async (c) => {
    const data = c.get('validatedBody') as any
    const seats = await seatService.bulkCreateSeats(data)
    return apiSuccess(c, seats, { statusCode: 201, message: 'Seats created' })
})

seatRoute.put('/sync', authMiddleware, adminMiddleware, schemaValidator(syncSeatsSchema), async (c) => {
    const data = c.get('validatedBody') as any
    const seats = await seatService.syncSeats(data)
    return apiSuccess(c, seats, { message: 'Seats synced successfully' })
})

seatRoute.patch('/:id', authMiddleware, adminMiddleware, schemaValidator(updateSeatSchema), async (c) => {
    const data = c.get('validatedBody') as any
    const seat = await seatService.updateSeat(c.req.param('id'), data)
    if (!seat) return apiError(c, 'Seat not found', { statusCode: 404, error: 'NOT_FOUND' })
    return apiSuccess(c, seat, { message: 'Seat updated' })
})
