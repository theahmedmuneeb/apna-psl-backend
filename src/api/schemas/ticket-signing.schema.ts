import { z } from "zod";

export const signTicketSchema = z.object({
  userAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address"),
  matchId: z.string().uuid(),
  seatId: z.string().uuid(),
});

export const confirmTicketSchema = z.object({
  txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/, "Invalid transaction hash"),
});

export type SignTicketInput = z.infer<typeof signTicketSchema>;
export type ConfirmTicketInput = z.infer<typeof confirmTicketSchema>;
