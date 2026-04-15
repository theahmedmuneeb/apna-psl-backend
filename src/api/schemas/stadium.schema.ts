import { z } from 'zod'

export const createStadiumSchema = z.object({
    name: z.string().min(1).max(200),
    location: z.string().min(1).max(300),
    sportmonksVenueId: z.number().int().positive(),
})

export const updateStadiumSchema = z.object({
    name: z.string().min(1).max(200).optional(),
    location: z.string().min(1).max(300).optional(),
    sportmonksVenueId: z.number().int().positive().optional(),
})

export type CreateStadiumInput = z.infer<typeof createStadiumSchema>
export type UpdateStadiumInput = z.infer<typeof updateStadiumSchema>
