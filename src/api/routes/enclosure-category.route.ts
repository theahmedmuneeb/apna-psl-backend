import { Hono } from 'hono'
import { apiSuccess, apiError } from '@/lib/api-response'
import type { AppVariables } from '@/api/types/app'
import { authMiddleware } from '@/api/middlewares/auth.middleware'
import { adminMiddleware } from '@/api/middlewares/admin.middleware'
import { schemaValidator } from '@/api/middlewares/schemaValidator.middleware'
import { createEnclosureCategorySchema, updateEnclosureCategorySchema } from '@/api/schemas/enclosure.schema'
import * as catService from '@/api/services/enclosure-category.service'

export const enclosureCategoryRoute = new Hono<{ Variables: AppVariables }>()

enclosureCategoryRoute.use('*', authMiddleware, adminMiddleware)

enclosureCategoryRoute.get('/', async (c) => {
    const categories = await catService.getAllEnclosureCategories()
    return apiSuccess(c, categories, { message: 'Categories fetched successfully' })
})

enclosureCategoryRoute.post('/', schemaValidator(createEnclosureCategorySchema), async (c) => {
    const data = c.get('validatedBody') as any
    const cat = await catService.createEnclosureCategory(data)
    return apiSuccess(c, cat, { statusCode: 201, message: 'Category created' })
})

enclosureCategoryRoute.patch('/:id', schemaValidator(updateEnclosureCategorySchema), async (c) => {
    const data = c.get('validatedBody') as any
    const cat = await catService.updateEnclosureCategory(c.req.param('id'), data)
    if (!cat) return apiError(c, 'Category not found', { statusCode: 404, error: 'NOT_FOUND' })
    return apiSuccess(c, cat, { message: 'Category updated' })
})

enclosureCategoryRoute.delete('/:id', async (c) => {
    const cat = await catService.deleteEnclosureCategory(c.req.param('id'))
    if (!cat) return apiError(c, 'Category not found', { statusCode: 404, error: 'NOT_FOUND' })
    return apiSuccess(c, cat, { message: 'Category deleted' })
})
