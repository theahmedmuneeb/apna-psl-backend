import { Hono } from 'hono'
import { getAllTeams } from '@/api/services/team.service'
import { apiSuccess } from '@/lib/api-response'
import type { AppVariables } from '@/api/types/app'
import { authMiddleware } from '@/api/middlewares/auth.middleware'

export const teamRoute = new Hono<{ Variables: AppVariables }>()

teamRoute.get('/', authMiddleware, async (c) => {
    const teams = await getAllTeams()
    return apiSuccess(c, teams, { message: 'Teams fetched successfully' })
})
