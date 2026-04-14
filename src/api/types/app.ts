import type { User } from '@supabase/supabase-js'
import type { UserProfile } from '@/api/services/profile.service'

export type AppProfile = UserProfile

export type AppVariables = {
    supabaseUser: User
    profile: AppProfile
    validatedBody: unknown
}