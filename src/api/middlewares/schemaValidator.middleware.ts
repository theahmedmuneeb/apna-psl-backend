import type { MiddlewareHandler } from 'hono'
import type { z, ZodTypeAny } from 'zod'
import { apiError } from '@/lib/api-response'
import type { AppVariables } from '@/api/types/app'

type ValidatorEnv = {
    Variables: AppVariables
}

export const schemaValidator = <TSchema extends ZodTypeAny>(
    schema: TSchema,
): MiddlewareHandler<ValidatorEnv> => {
    return async (c, next) => {
        let payload: unknown

        try {
            payload = await c.req.json()
        } catch {
            return apiError(c, 'Invalid JSON body', {
                statusCode: 400,
                error: 'INVALID_JSON_BODY',
            })
        }

        const result = schema.safeParse(payload)

        if (!result.success) {
            return apiError(c, `Validation failed: ${result.error.issues[0]?.message ?? 'invalid input'}`, {
                statusCode: 400,
                error: 'VALIDATION_ERROR',
            })
        }

        c.set('validatedBody', result.data as z.infer<TSchema>)
        await next()
    }
}