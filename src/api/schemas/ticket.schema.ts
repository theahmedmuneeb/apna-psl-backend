import { z } from 'zod'

export const createTicketSchema = z.object({
    ownerId: z.string().uuid().nullable().optional(),
    walletAddress: z.string().max(42),
    matchId: z.string().uuid(),
    seatId: z.string().uuid(),
    enclosureCategoryId: z.string().uuid(),
    nftContractAddress: z.string().max(42).nullable().optional(),
    nftTokenId: z.string().max(78).nullable().optional(),
    nftMetadata: z.record(z.string(), z.unknown()).nullable().optional(),
    status: z.enum(['valid', 'used', 'cancelled', 'expired']).optional(),
})

export const updateTicketSchema = z.object({
    ownerId: z.string().uuid().nullable().optional(),
    walletAddress: z.string().max(42).optional(),
    nftContractAddress: z.string().max(42).nullable().optional(),
    nftTokenId: z.string().max(78).nullable().optional(),
    nftMetadata: z.record(z.string(), z.unknown()).nullable().optional(),
    status: z.enum(['valid', 'used', 'cancelled', 'expired']).optional(),
})

export type CreateTicketInput = z.infer<typeof createTicketSchema>
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>
