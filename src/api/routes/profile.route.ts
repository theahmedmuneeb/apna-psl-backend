import { Hono } from 'hono'
import { authMiddleware } from '@/api/middlewares/auth.middleware'
import { profileMiddleware } from '@/api/middlewares/profile.middleware'
import { schemaValidator } from '@/api/middlewares/schemaValidator.middleware'
import {
	createProfileSchema,
	editProfileSchema,
	selectProfileTeamSchema,
	type CreateProfileInput,
	type EditProfileInput,
	type SelectProfileTeamInput,
} from '@/api/schemas'
import {
	createUserProfile,
	editUserProfile,
	getUserProfileById,
	setUserProfileTeam,
} from '@/api/services/profile.service'
import { getTeamById } from '@/api/services/team.service'
import type { AppVariables } from '@/api/types/app'
import { apiError, apiSuccess } from '@/lib/api-response'

export const profileRoute = new Hono<{ Variables: AppVariables }>()

profileRoute.get('/me', authMiddleware, profileMiddleware, async (c) => {
	return apiSuccess(c, c.get('profile'), { message: 'Profile fetched successfully' })
})

profileRoute.post(
	'/',
	authMiddleware,
	schemaValidator(createProfileSchema),
	async (c) => {
		const user = c.get('supabaseUser')
		const body = c.get('validatedBody') as CreateProfileInput
		const metadata = user.user_metadata as Record<string, unknown> | undefined
		const nameFromSupabase = metadata?.name
		const fullName =
			typeof nameFromSupabase === 'string' && nameFromSupabase.trim().length > 0
				? nameFromSupabase.trim()
				: 'John Doe'
				
		const existingProfile = await getUserProfileById(user.id)

		if (existingProfile) {
			return apiError(c, 'Profile already exists', {
				statusCode: 409,
				error: 'PROFILE_ALREADY_EXISTS',
			})
		}

		const profile = await createUserProfile(user.id, {
			...body,
			fullName,
		})
		return apiSuccess(c, profile, {
			statusCode: 201,
			message: 'Profile created successfully',
		})
	},
)

profileRoute.post(
	'/team',
	authMiddleware,
	profileMiddleware,
	schemaValidator(selectProfileTeamSchema),
	async (c) => {
		const user = c.get('supabaseUser')
		const body = c.get('validatedBody') as SelectProfileTeamInput

		const selectedTeam = await getTeamById(body.teamId)

		if (!selectedTeam) {
			return apiError(c, 'Team not found', {
				statusCode: 404,
				error: 'TEAM_NOT_FOUND',
			})
		}

		const profile = await setUserProfileTeam(user.id, body.teamId)

		return apiSuccess(c, profile, {
			message: 'Profile team updated successfully',
		})
	},
)

profileRoute.patch(
	'/',
	authMiddleware,
	profileMiddleware,
	schemaValidator(editProfileSchema),
	async (c) => {
		const user = c.get('supabaseUser')
		const body = c.get('validatedBody') as EditProfileInput

		const profile = await editUserProfile(user.id, body)

		return apiSuccess(c, profile, {
			message: 'Profile updated successfully',
		})
	},
)
