import { Hono } from 'hono'
import { authMiddleware } from '@/api/middlewares/auth.middleware'
import { profileMiddleware } from '@/api/middlewares/profile.middleware'
import { schemaValidator } from '@/api/middlewares/schemaValidator.middleware'
import { linkWalletSchema, type LinkWalletInput } from '@/api/schemas'
import { setUserWalletAddress, unsetUserWalletAddress } from '@/api/services/wallet.service'
import type { AppVariables } from '@/api/types/app'
import { apiError, apiSuccess } from '@/lib/api-response'
import {
    isWirefluidChain,
    wirefluidChain,
    normalizeEvmAddress,
    recoverAddressFromMessageSignature,
} from '@/lib/ethers'

export const walletRoute = new Hono<{ Variables: AppVariables }>()

walletRoute.post(
    '/link',
    authMiddleware,
    profileMiddleware,
    schemaValidator(linkWalletSchema),
    async (c) => {
        const user = c.get('supabaseUser')
        const body = c.get('validatedBody') as LinkWalletInput

        if (!isWirefluidChain(body.chainId)) {
            return apiError(c, `Unsupported chain. Please switch to ${wirefluidChain.name}`, {
                statusCode: 400,
                error: 'UNSUPPORTED_CHAIN',
            })
        }

        let recoveredAddress: string

        try {
            recoveredAddress = recoverAddressFromMessageSignature(body.message, body.signature)
        } catch {
            return apiError(c, 'Invalid signature', {
                statusCode: 400,
                error: 'INVALID_WALLET_SIGNATURE',
            })
        }

        if (body.address) {
            try {
                const requestedAddress = normalizeEvmAddress(body.address)

                if (requestedAddress !== recoveredAddress) {
                    return apiError(c, 'Signature does not match the provided address', {
                        statusCode: 400,
                        error: 'WALLET_ADDRESS_MISMATCH',
                    })
                }
            } catch {
                return apiError(c, 'Invalid wallet address', {
                    statusCode: 400,
                    error: 'INVALID_WALLET_ADDRESS',
                })
            }
        }

        const linkedWallet = await setUserWalletAddress(user.id, recoveredAddress)

        return apiSuccess(c, linkedWallet, {
            message: 'Wallet linked successfully',
        })
    },
)

walletRoute.delete('/unlink', authMiddleware, profileMiddleware, async (c) => {
    const user = c.get('supabaseUser')
    const unlinkedWallet = await unsetUserWalletAddress(user.id)

    return apiSuccess(c, unlinkedWallet, {
        message: 'Wallet unlinked successfully',
    })
})