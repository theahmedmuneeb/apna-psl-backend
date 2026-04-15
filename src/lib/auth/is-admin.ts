import type { User } from '@supabase/supabase-js'

/**
 * Check if a Supabase user has admin role.
 * Checks both user_metadata and app_metadata for "admin" in role or roles.
 * Shared between Next.js middleware and Hono API middleware.
 */
export function isUserAdmin(user: User): boolean {
    const userMetadata = (user.user_metadata || {}) as Record<string, unknown>
    const appMetadata = (user.app_metadata || {}) as Record<string, unknown>

    return (
        (typeof userMetadata.role === 'string' && userMetadata.role.toLowerCase() === 'admin') ||
        (typeof appMetadata.role === 'string' && appMetadata.role.toLowerCase() === 'admin') ||
        (Array.isArray(userMetadata.roles) &&
            userMetadata.roles.some((r) => typeof r === 'string' && r.toLowerCase() === 'admin')) ||
        (Array.isArray(appMetadata.roles) &&
            appMetadata.roles.some((r) => typeof r === 'string' && r.toLowerCase() === 'admin'))
    )
}
