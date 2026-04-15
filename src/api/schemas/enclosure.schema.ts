import { z } from 'zod'

// --- Enclosure Category ---
export const createEnclosureCategorySchema = z.object({
    name: z.string().min(1).max(100),
})

export const updateEnclosureCategorySchema = z.object({
    name: z.string().min(1).max(100).optional(),
})

export type CreateEnclosureCategoryInput = z.infer<typeof createEnclosureCategorySchema>
export type UpdateEnclosureCategoryInput = z.infer<typeof updateEnclosureCategorySchema>

// --- Enclosure ---
export const createEnclosureSchema = z.object({
    stadiumId: z.string().uuid(),
    name: z.string().min(1).max(200),
    enclosureCategoryId: z.string().uuid(),
    config: z.record(z.string(), z.unknown()).nullable().optional(),
})

export const updateEnclosureSchema = z.object({
    name: z.string().min(1).max(200).optional(),
    enclosureCategoryId: z.string().uuid().optional(),
    config: z.record(z.string(), z.unknown()).nullable().optional(),
})

export type CreateEnclosureInput = z.infer<typeof createEnclosureSchema>
export type UpdateEnclosureInput = z.infer<typeof updateEnclosureSchema>
