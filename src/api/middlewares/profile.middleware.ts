import type { MiddlewareHandler } from 'hono'
import { getUserProfileById } from '@/api/services/profile.service'
import { apiError } from '@/lib/api-response'
import type { AppVariables } from '@/api/types/app'

type ProfileEnv = {
    Variables: AppVariables
}

export const profileMiddleware: MiddlewareHandler<ProfileEnv> = async (c, next) => {
    const user = c.get('supabaseUser')
    const profile = await getUserProfileById(user.id)

    if (!profile) {
        return apiError(c, 'Profile not found', {
            statusCode: 404,
            error: 'PROFILE_NOT_FOUND',
        })
    }

    c.set('profile', profile)
    await next()
}