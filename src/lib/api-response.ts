import type { Context } from 'hono'

export type ApiResponse<T> = {
    data: T | null
    success: boolean
    error: string | null
    statusCode: number
    message: string
}

type ApiSuccessOptions = {
    statusCode?: number
    message?: string
}

type ApiErrorOptions = {
    statusCode?: number
    error?: string
    message?: string
}

export const apiSuccess = <T>(
    c: Context,
    data: T,
    options: ApiSuccessOptions = {},
) => {
    const statusCode = options.statusCode ?? 200

    return c.json<ApiResponse<T>>(
        {
            data,
            success: true,
            error: null,
            statusCode,
            message: options.message ?? 'Success',
        },
        statusCode as any,
    )
}

export const apiError = (
    c: Context,
    message: string,
    options: ApiErrorOptions = {},
) => {
    const statusCode = options.statusCode ?? 500
    const errorCode = options.error ?? 'INTERNAL_SERVER_ERROR'

    return c.json<ApiResponse<null>>(
        {
            data: null,
            success: false,
            error: errorCode,
            statusCode,
            message,
        },
        statusCode as any,
    )
}