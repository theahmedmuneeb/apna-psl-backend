import { Hono } from 'hono'
import { apiSuccess, apiError } from '@/lib/api-response'
import type { AppVariables } from '@/api/types/app'
import { authMiddleware } from '@/api/middlewares/auth.middleware'
import { adminMiddleware } from '@/api/middlewares/admin.middleware'
import { schemaValidator } from '@/api/middlewares/schemaValidator.middleware'
import { createPricingSchema, updatePricingSchema } from '@/api/schemas/pricing.schema'
import * as pricingService from '@/api/services/pricing.service'

export const pricingRoute = new Hono<{ Variables: AppVariables }>()

pricingRoute.get('/', authMiddleware, async (c) => {
    const matchId = c.req.query('matchId')
    if (!matchId) return apiError(c, 'matchId query param required', { statusCode: 400, error: 'MISSING_PARAM' })
    const pricing = await pricingService.getPricingByMatch(matchId)
    return apiSuccess(c, pricing, { message: 'Pricing fetched successfully' })
})

pricingRoute.post('/', authMiddleware, adminMiddleware, schemaValidator(createPricingSchema), async (c) => {
    const data = c.get('validatedBody') as any
    const pricing = await pricingService.createPricing(data)
    return apiSuccess(c, pricing, { statusCode: 201, message: 'Pricing created' })
})

pricingRoute.patch('/:id', authMiddleware, adminMiddleware, schemaValidator(updatePricingSchema), async (c) => {
    const data = c.get('validatedBody') as any
    const pricing = await pricingService.updatePricing(c.req.param('id'), data)
    if (!pricing) return apiError(c, 'Pricing not found', { statusCode: 404, error: 'NOT_FOUND' })
    return apiSuccess(c, pricing, { message: 'Pricing updated' })
})

pricingRoute.delete('/:id', authMiddleware, adminMiddleware, async (c) => {
    const pricing = await pricingService.deletePricing(c.req.param('id'))
    if (!pricing) return apiError(c, 'Pricing not found', { statusCode: 404, error: 'NOT_FOUND' })
    return apiSuccess(c, pricing, { message: 'Pricing deleted' })
})
