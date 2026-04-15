import { z } from 'zod'

const seatItemSchema = z.object({
    seatNumber: z.number().int().positive(),
    label: z.string().min(1).max(50),
})

const rowConfigSchema = z.object({
    rowLabel: z.string().min(1).max(50),
    seats: z.array(seatItemSchema).min(1),
})

export const bulkCreateSeatsSchema = z.object({
    enclosureId: z.string().uuid(),
    rows: z.array(rowConfigSchema).min(1),
})

export const syncSeatsSchema = z.object({
    enclosureId: z.string().uuid(),
    rows: z.array(rowConfigSchema).min(1),
})

export const updateSeatSchema = z.object({
    rowLabel: z.string().min(1).max(50).optional(),
    seatNumber: z.number().int().positive().optional(),
    label: z.string().min(1).max(50).optional(),
    isActive: z.boolean().optional(),
})

export type BulkCreateSeatsInput = z.infer<typeof bulkCreateSeatsSchema>
export type SyncSeatsInput = z.infer<typeof syncSeatsSchema>
export type UpdateSeatInput = z.infer<typeof updateSeatSchema>
