import { z } from 'zod'

export const currencyEnumSchema = z.enum(['WIRE', 'PSL'])

export const createPricingSchema = z.object({
    matchId: z.string().uuid(),
    enclosureCategoryId: z.string().uuid(),
    price: z.string().regex(/^\d+(\.\d{1,6})?$/, 'Invalid price format'),
    currency: currencyEnumSchema,
})

export const updatePricingSchema = z.object({
    price: z.string().regex(/^\d+(\.\d{1,6})?$/, 'Invalid price format').optional(),
    currency: currencyEnumSchema.optional(),
})

export type CreatePricingInput = z.infer<typeof createPricingSchema>
export type UpdatePricingInput = z.infer<typeof updatePricingSchema>
