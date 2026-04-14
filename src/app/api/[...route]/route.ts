import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import { profileRoute } from '@/api/routes/profile.route'
import { storyRoute } from '@/api/routes/story.route'
import { teamRoute } from '@/api/routes/team.route'
import { walletRoute } from '@/api/routes/wallet.route'
import { apiError } from '@/lib/api-response'
import type { AppVariables } from '@/api/types/app'
import { trimTrailingSlash } from 'hono/trailing-slash'


const app = new Hono<{ Variables: AppVariables }>().basePath('/api')

app.use('*', trimTrailingSlash())

app.onError((err, c) => {
  return apiError(c, 'Internal Server Error', {
    statusCode: 500,
    error: 'INTERNAL_SERVER_ERROR',
  })
})

app.route('/profile', profileRoute)
app.route('/stories', storyRoute)
app.route('/teams', teamRoute)
app.route('/wallet', walletRoute)

export const GET = handle(app)
export const POST = handle(app)
export const PATCH = handle(app)
export const PUT = handle(app)
export const DELETE = handle(app)
