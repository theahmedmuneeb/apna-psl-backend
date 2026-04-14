import { env } from '@/env'

export const toSupabasePublicUrl = (filePath: string | null): string | null => {
    if (!filePath) {
        return null
    }

    if (/^https?:\/\//i.test(filePath)) {
        return filePath
    }

    const normalizedPath = filePath.replace(/^\/+/, '')
    return `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${env.SUPABASE_STORAGE_BUCKET}/${normalizedPath}`
}
