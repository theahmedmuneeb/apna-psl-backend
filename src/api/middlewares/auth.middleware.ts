import type { MiddlewareHandler } from 'hono'
import { getCookie, setCookie } from 'hono/cookie'
import { createServerClient } from '@supabase/ssr'
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

/**
 * Auth middleware that supports two modes:
 * 1. Bearer token (Authorization header) — for external API consumers
 * 2. Supabase SSR cookies — for admin dashboard same-origin fetch() calls
 */
export const authMiddleware: MiddlewareHandler<AuthEnv> = async (c, next) => {
    // Mode 1: Bearer token from Authorization header
    const authHeader = c.req.header('authorization')
    if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
        const token = authHeader.slice(7).trim()
        if (token) {
            return authenticateWithToken(c, token, next)
        }
    }

    // Mode 2: Supabase SSR cookies (admin dashboard)
    try {
        const supabaseClient = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_KEY!,
            {
                cookies: {
                    getAll() {
                        // Read all cookies from the Hono request
                        const allCookies = getCookie(c)
                        return Object.entries(allCookies).map(([name, value]) => ({
                            name,
                            value: value ?? '',
                        }))
                    },
                    setAll(cookies) {
                        for (const cookie of cookies) {
                            setCookie(c, cookie.name, cookie.value, cookie.options as any)
                        }
                    },
                },
            }
        )

        const { data, error } = await supabaseClient.auth.getUser()

        if (!error && data.user) {
            c.set('supabaseUser', data.user)
            return next()
        }
    } catch {
        // Cookie auth failed, fall through to error
    }

    return apiError(c, 'Unauthorized: missing or invalid authentication', {
        statusCode: 401,
        error: 'AUTH_MISSING',
    })
}

async function authenticateWithToken(c: any, token: string, next: () => Promise<void>) {
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
        return next()
    } catch {
        return apiError(c, 'Authentication provider unavailable', {
            statusCode: 500,
            error: 'AUTH_PROVIDER_UNAVAILABLE',
        })
    }
}