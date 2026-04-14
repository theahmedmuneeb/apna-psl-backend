import { z } from 'zod'

const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/
const ethSignatureRegex = /^0x[a-fA-F0-9]{130}$/

export const linkWalletSchema = z.object({
    chainId: z.union([
        z
            .string()
            .trim()
            .min(1, 'Chain ID is required'),
        z
            .number()
            .int()
            .positive('Chain ID must be positive'),
    ]),
    message: z.string().trim().min(1, 'Message is required').max(500),
    signature: z
        .string()
        .trim()
        .regex(ethSignatureRegex, 'Signature must be a valid 65-byte hex signature'),
    address: z
        .string()
        .trim()
        .regex(ethAddressRegex, 'Address must be a valid EVM address')
        .optional(),
})

export type LinkWalletInput = z.infer<typeof linkWalletSchema>