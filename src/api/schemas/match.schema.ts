import { z } from 'zod'

export const createMatchSchema = z.object({
    sportmonksMatchId: z.number().int().positive().nullable().optional(),
    teamAId: z.string().uuid(),
    teamBId: z.string().uuid(),
    stadiumId: z.string().uuid(),
    startTime: z.string().datetime({ offset: true }),
})

export const updateMatchSchema = z.object({
    teamAId: z.string().uuid().optional(),
    teamBId: z.string().uuid().optional(),
    stadiumId: z.string().uuid().optional(),
    startTime: z.string().datetime({ offset: true }).optional(),
})

export type CreateMatchInput = z.infer<typeof createMatchSchema>
export type UpdateMatchInput = z.infer<typeof updateMatchSchema>
