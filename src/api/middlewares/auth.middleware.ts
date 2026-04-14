import type { MiddlewareHandler } from 'hono'
import { apiError } from '@/lib/api-response'
import { supabase } from '@/lib/supabase'
import type { AppVariables } from '@/api/types/app'

type AuthEnv = {
    Variables: AppVariables
}

const isAuthFailure = (error: { status?: number; message?: string } | null) => {
    if (!error) {
        return false
    }

    if (error.status === 400 || error.status === 401 || error.status === 403) {
        return true
    }

    const message = (error.message ?? '').toLowerCase()
    return (
        message.includes('invalid jwt') ||
        message.includes('jwt') ||
        message.includes('token') ||
        message.includes('unauthorized')
    )
}

export const authMiddleware: MiddlewareHandler<AuthEnv> = async (c, next) => {
    const authHeader = c.req.header('authorization')

    if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
        return apiError(c, 'Unauthorized: missing bearer token', {
            statusCode: 401,
            error: 'AUTH_MISSING_BEARER_TOKEN',
        })
    }

    const token = authHeader.slice(7).trim()

    if (!token) {
        return apiError(c, 'Unauthorized: invalid bearer token', {
            statusCode: 401,
            error: 'AUTH_INVALID_BEARER_TOKEN',
        })
    }

    try {
        const { data, error } = await supabase.auth.getUser(token)

        if (error) {
            if (isAuthFailure(error)) {
                return apiError(c, 'Unauthorized: invalid token', {
                    statusCode: 401,
                    error: 'AUTH_INVALID_TOKEN',
                })
            }

            return apiError(c, 'Authentication provider unavailable', {
                statusCode: 500,
                error: 'AUTH_PROVIDER_UNAVAILABLE',
            })
        }

        if (!data.user) {
            return apiError(c, 'Unauthorized: invalid token', {
                statusCode: 401,
                error: 'AUTH_INVALID_TOKEN',
            })
        }

        c.set('supabaseUser', data.user)
        await next()
    } catch {
        return apiError(c, 'Authentication provider unavailable', {
            statusCode: 500,
            error: 'AUTH_PROVIDER_UNAVAILABLE',
        })
    }
}