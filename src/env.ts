import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    SUPABASE_STORAGE_BUCKET: z.string().min(1).default("psl"),
    SUPABASE_SECRET_KEY: z.string().min(1),
    SPORTMONKS_API_TOKEN: z.string().min(1),
    SPORTMONKS_PSL_LEAGUE_ID: z.coerce.number().int().positive(),
    SPORTMONKS_PSL_SEASON_ID: z.coerce.number().int().positive(),
  },
  client: {
    NEXT_PUBLIC_WALLET_BRIDGE_DEEP_LINK_BASE: z
      .string()
      .min(1)
      .default("yourapp://connected"),
    NEXT_PUBLIC_WALLET_BRIDGE_REDIRECT_FALLBACK_URL: z
      .string()
      .url()
      .optional(),
    NEXT_PUBLIC_WALLET_BRIDGE_REDIRECT_TIMEOUT_MS: z.coerce
      .number()
      .int()
      .positive()
      .default(2500),
    NEXT_PUBLIC_WALLET_BRIDGE_CHAIN_NAME: z
      .string()
      .min(1)
      .default("Wirefluid Testnet"),
    NEXT_PUBLIC_WALLET_BRIDGE_CHAIN_ID_HEX: z
      .string()
      .min(1)
      .default("0x16975"),
    NEXT_PUBLIC_WALLET_BRIDGE_CHAIN_ID_DECIMAL: z.coerce
      .number()
      .int()
      .positive()
      .default(92533),
    NEXT_PUBLIC_WALLET_BRIDGE_RPC_URL: z
      .string()
      .url()
      .default("https://evm.wirefluid.com"),
    NEXT_PUBLIC_WALLET_BRIDGE_NATIVE_CURRENCY_NAME: z
      .string()
      .min(1)
      .default("Wirefluid"),
    NEXT_PUBLIC_WALLET_BRIDGE_NATIVE_CURRENCY_SYMBOL: z
      .string()
      .min(1)
      .default("WIRE"),
    NEXT_PUBLIC_WALLET_BRIDGE_NATIVE_CURRENCY_DECIMALS: z.coerce
      .number()
      .int()
      .nonnegative()
      .default(18),
    NEXT_PUBLIC_WALLET_BRIDGE_BLOCK_EXPLORER_URL: z
      .string()
      .url()
      .default("https://wirefluidscan.com"),
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_KEY: z.string().min(1),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    NEXT_PUBLIC_WALLET_BRIDGE_DEEP_LINK_BASE:
      process.env.NEXT_PUBLIC_WALLET_BRIDGE_DEEP_LINK_BASE,
    NEXT_PUBLIC_WALLET_BRIDGE_REDIRECT_FALLBACK_URL:
      process.env.NEXT_PUBLIC_WALLET_BRIDGE_REDIRECT_FALLBACK_URL,
    NEXT_PUBLIC_WALLET_BRIDGE_REDIRECT_TIMEOUT_MS:
      process.env.NEXT_PUBLIC_WALLET_BRIDGE_REDIRECT_TIMEOUT_MS,
    NEXT_PUBLIC_WALLET_BRIDGE_CHAIN_NAME:
      process.env.NEXT_PUBLIC_WALLET_BRIDGE_CHAIN_NAME,
    NEXT_PUBLIC_WALLET_BRIDGE_CHAIN_ID_HEX:
      process.env.NEXT_PUBLIC_WALLET_BRIDGE_CHAIN_ID_HEX,
    NEXT_PUBLIC_WALLET_BRIDGE_CHAIN_ID_DECIMAL:
      process.env.NEXT_PUBLIC_WALLET_BRIDGE_CHAIN_ID_DECIMAL,
    NEXT_PUBLIC_WALLET_BRIDGE_RPC_URL:
      process.env.NEXT_PUBLIC_WALLET_BRIDGE_RPC_URL,
    NEXT_PUBLIC_WALLET_BRIDGE_NATIVE_CURRENCY_NAME:
      process.env.NEXT_PUBLIC_WALLET_BRIDGE_NATIVE_CURRENCY_NAME,
    NEXT_PUBLIC_WALLET_BRIDGE_NATIVE_CURRENCY_SYMBOL:
      process.env.NEXT_PUBLIC_WALLET_BRIDGE_NATIVE_CURRENCY_SYMBOL,
    NEXT_PUBLIC_WALLET_BRIDGE_NATIVE_CURRENCY_DECIMALS:
      process.env.NEXT_PUBLIC_WALLET_BRIDGE_NATIVE_CURRENCY_DECIMALS,
    NEXT_PUBLIC_WALLET_BRIDGE_BLOCK_EXPLORER_URL:
      process.env.NEXT_PUBLIC_WALLET_BRIDGE_BLOCK_EXPLORER_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_KEY: process.env.NEXT_PUBLIC_SUPABASE_KEY,
    SUPABASE_STORAGE_BUCKET: process.env.SUPABASE_STORAGE_BUCKET,
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
    SPORTMONKS_API_TOKEN: process.env.SPORTMONKS_API_TOKEN,
    SPORTMONKS_PSL_LEAGUE_ID: process.env.SPORTMONKS_PSL_LEAGUE_ID,
    SPORTMONKS_PSL_SEASON_ID: process.env.SPORTMONKS_PSL_SEASON_ID,
  },
})