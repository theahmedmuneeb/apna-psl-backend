import { env } from '@/env'
import { getAddress, verifyMessage } from 'ethers'

export const wirefluidChain = {
    id: env.NEXT_PUBLIC_WALLET_BRIDGE_CHAIN_ID_DECIMAL,
    name: env.NEXT_PUBLIC_WALLET_BRIDGE_CHAIN_NAME,
    rpcUrl: env.NEXT_PUBLIC_WALLET_BRIDGE_RPC_URL,
    chainIdHex: env.NEXT_PUBLIC_WALLET_BRIDGE_CHAIN_ID_HEX.toLowerCase(),
    nativeCurrency: {
        name: env.NEXT_PUBLIC_WALLET_BRIDGE_NATIVE_CURRENCY_NAME,
        symbol: env.NEXT_PUBLIC_WALLET_BRIDGE_NATIVE_CURRENCY_SYMBOL,
        decimals: env.NEXT_PUBLIC_WALLET_BRIDGE_NATIVE_CURRENCY_DECIMALS,
    },
    blockExplorerUrl: env.NEXT_PUBLIC_WALLET_BRIDGE_BLOCK_EXPLORER_URL,
} as const

export const toNormalizedChainHex = (chainId: string | number): string => {
    if (typeof chainId === 'number') {
        return `0x${chainId.toString(16)}`.toLowerCase()
    }

    const value = chainId.trim().toLowerCase()

    if (value.startsWith('0x')) {
        return value
    }

    const parsed = Number(value)

    if (!Number.isInteger(parsed) || parsed <= 0) {
        throw new Error('Invalid chain id')
    }

    return `0x${parsed.toString(16)}`.toLowerCase()
}

export const isWirefluidChain = (chainId: string | number): boolean => {
    return toNormalizedChainHex(chainId) === wirefluidChain.chainIdHex
}

export const recoverAddressFromMessageSignature = (
    message: string,
    signature: string,
): string => {
    return getAddress(verifyMessage(message, signature))
}

export const normalizeEvmAddress = (address: string): string => {
    return getAddress(address)
}