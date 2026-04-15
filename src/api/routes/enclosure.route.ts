import { Hono } from 'hono'
import { apiSuccess, apiError } from '@/lib/api-response'
import type { AppVariables } from '@/api/types/app'
import { authMiddleware } from '@/api/middlewares/auth.middleware'
import { adminMiddleware } from '@/api/middlewares/admin.middleware'
import { schemaValidator } from '@/api/middlewares/schemaValidator.middleware'
import { createEnclosureSchema, updateEnclosureSchema } from '@/api/schemas/enclosure.schema'
import * as encService from '@/api/services/enclosure.service'

export const enclosureRoute = new Hono<{ Variables: AppVariables }>()

enclosureRoute.get('/', authMiddleware, async (c) => {
    const stadiumId = c.req.query('stadiumId')
    if (!stadiumId) return apiError(c, 'stadiumId query param required', { statusCode: 400, error: 'MISSING_PARAM' })
    const enclosures = await encService.getEnclosuresByStadium(stadiumId)
    return apiSuccess(c, enclosures, { message: 'Enclosures fetched successfully' })
})

enclosureRoute.get('/:id', authMiddleware, async (c) => {
    const enc = await encService.getEnclosureById(c.req.param('id'))
    if (!enc) return apiError(c, 'Enclosure not found', { statusCode: 404, error: 'NOT_FOUND' })
    return apiSuccess(c, enc)
})

enclosureRoute.post('/', authMiddleware, adminMiddleware, schemaValidator(createEnclosureSchema), async (c) => {
    const data = c.get('validatedBody') as any
    const enc = await encService.createEnclosure(data)
    return apiSuccess(c, enc, { statusCode: 201, message: 'Enclosure created' })
})

enclosureRoute.patch('/:id', authMiddleware, adminMiddleware, schemaValidator(updateEnclosureSchema), async (c) => {
    const data = c.get('validatedBody') as any
    const enc = await encService.updateEnclosure(c.req.param('id'), data)
    if (!enc) return apiError(c, 'Enclosure not found', { statusCode: 404, error: 'NOT_FOUND' })
    return apiSuccess(c, enc, { message: 'Enclosure updated' })
})

enclosureRoute.delete('/:id', authMiddleware, adminMiddleware, async (c) => {
    const enc = await encService.deleteEnclosure(c.req.param('id'))
    if (!enc) return apiError(c, 'Enclosure not found', { statusCode: 404, error: 'NOT_FOUND' })
    return apiSuccess(c, enc, { message: 'Enclosure deleted' })
})
