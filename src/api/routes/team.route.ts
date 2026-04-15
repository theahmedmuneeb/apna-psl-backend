import { Hono } from 'hono'
import { getAllTeams, getTeamById, createTeam, updateTeam, deleteTeam } from '@/api/services/team.service'
import { apiSuccess, apiError } from '@/lib/api-response'
import type { AppVariables } from '@/api/types/app'
import { authMiddleware } from '@/api/middlewares/auth.middleware'
import { adminMiddleware } from '@/api/middlewares/admin.middleware'

export const teamRoute = new Hono<{ Variables: AppVariables }>()

// Public read access (used by mobile app)
teamRoute.get('/', authMiddleware, async (c) => {
    const includePlaceholders = c.req.query('includePlaceholders') === 'true'
    const teams = await getAllTeams({ includePlaceholders })
    return apiSuccess(c, teams, { message: 'Teams fetched successfully' })
})

teamRoute.get('/:id', authMiddleware, async (c) => {
    const team = await getTeamById(c.req.param('id'))
    if (!team) return apiError(c, 'Team not found', { statusCode: 404, error: 'NOT_FOUND' })
    return apiSuccess(c, team)
})

// Admin-only write operations
teamRoute.post('/', authMiddleware, adminMiddleware, async (c) => {
    try {
        const body = await c.req.parseBody()
        const name = String(body['name'] ?? '').trim()
        const shortName = String(body['shortName'] ?? '').trim()
        const sportmonksTeamIdStr = String(body['sportmonksTeamId'] ?? '').trim()
        const logoFile = body['logoFile']
        const isPlaceholder = String(body['isPlaceholder'] ?? 'false') === 'true'

        const sportmonksTeamId = parseInt(sportmonksTeamIdStr, 10)

        if (!name || !shortName || isNaN(sportmonksTeamId) || sportmonksTeamId < 0) {
            return apiError(c, 'Name, short name, and valid Sportmonks Team ID are required', {
                statusCode: 400,
                error: 'VALIDATION_ERROR',
            })
        }

        const team = await createTeam({
            name,
            shortName,
            sportmonksTeamId,
            logoFile: logoFile instanceof File && logoFile.size > 0 ? logoFile : null,
            isPlaceholder,
        })
        return apiSuccess(c, team, { statusCode: 201, message: 'Team created' })
    } catch (err: any) {
        return apiError(c, err.message ?? 'Failed to create team', { statusCode: 500 })
    }
})

teamRoute.patch('/:id', authMiddleware, adminMiddleware, async (c) => {
    try {
        const teamId = c.req.param('id')
        const body = await c.req.parseBody()
        const name = String(body['name'] ?? '').trim()
        const shortName = String(body['shortName'] ?? '').trim()
        const sportmonksTeamIdStr = String(body['sportmonksTeamId'] ?? '').trim()
        const logoFile = body['logoFile']

        const sportmonksTeamId = parseInt(sportmonksTeamIdStr, 10)

        if (!name || !shortName || isNaN(sportmonksTeamId) || sportmonksTeamId < 0) {
            return apiError(c, 'Name, short name, and valid Sportmonks Team ID are required', {
                statusCode: 400,
                error: 'VALIDATION_ERROR',
            })
        }

        const team = await updateTeam(teamId, {
            name,
            shortName,
            sportmonksTeamId,
            logoFile: logoFile instanceof File && logoFile.size > 0 ? logoFile : null,
        })
        if (!team) return apiError(c, 'Team not found', { statusCode: 404, error: 'NOT_FOUND' })
        return apiSuccess(c, team, { message: 'Team updated' })
    } catch (err: any) {
        return apiError(c, err.message ?? 'Failed to update team', { statusCode: 500 })
    }
})

teamRoute.delete('/:id', authMiddleware, adminMiddleware, async (c) => {
    const team = await deleteTeam(c.req.param('id'))
    if (!team) return apiError(c, 'Team not found', { statusCode: 404, error: 'NOT_FOUND' })
    return apiSuccess(c, team, { message: 'Team deleted' })
})
