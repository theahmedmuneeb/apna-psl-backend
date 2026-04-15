import type { MiddlewareHandler } from 'hono'
import { apiError } from '@/lib/api-response'
import type { AppVariables } from '@/api/types/app'
import { isUserAdmin } from '@/lib/auth/is-admin'

type AdminEnv = {
    Variables: AppVariables
}

/**
 * Checks if the authenticated Supabase user has admin role.
 * Uses the shared isUserAdmin utility from @/lib/auth/is-admin.
 *
 * Must be used AFTER authMiddleware (requires `supabaseUser` to be set).
 */
export const adminMiddleware: MiddlewareHandler<AdminEnv> = async (c, next) => {
    const user = c.get('supabaseUser')

    if (!user) {
        return apiError(c, 'Unauthorized: not authenticated', {
            statusCode: 401,
            error: 'AUTH_REQUIRED',
        })
    }

    if (!isUserAdmin(user)) {
        return apiError(c, 'Forbidden: admin access required', {
            statusCode: 403,
            error: 'ADMIN_REQUIRED',
        })
    }

    await next()
}
