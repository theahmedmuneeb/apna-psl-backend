import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import { profileRoute } from '@/api/routes/profile.route'
import { storyRoute } from '@/api/routes/story.route'
import { teamRoute } from '@/api/routes/team.route'
import { walletRoute } from '@/api/routes/wallet.route'
import { stadiumRoute } from '@/api/routes/stadium.route'
import { enclosureCategoryRoute } from '@/api/routes/enclosure-category.route'
import { enclosureRoute } from '@/api/routes/enclosure.route'
import { seatRoute } from '@/api/routes/seat.route'
import { matchRoute } from '@/api/routes/match.route'
import { pricingRoute } from '@/api/routes/pricing.route'
import { sportmonksRoute } from '@/api/routes/sportmonks.route'
import { ticketRoute } from '@/api/routes/ticket.route'
import { apiError } from '@/lib/api-response'
import type { AppVariables } from '@/api/types/app'
import { trimTrailingSlash } from 'hono/trailing-slash'


const app = new Hono<{ Variables: AppVariables }>().basePath('/api')

app.use('*', trimTrailingSlash())

app.onError((err, c) => {
  console.error('[api] Unhandled error:', err)
  return apiError(c, 'Internal Server Error', {
    statusCode: 500,
    error: 'INTERNAL_SERVER_ERROR',
  })
})

app.route('/profile', profileRoute)
app.route('/stories', storyRoute)
app.route('/teams', teamRoute)
app.route('/wallet', walletRoute)
app.route('/stadiums', stadiumRoute)
app.route('/enclosure-categories', enclosureCategoryRoute)
app.route('/enclosures', enclosureRoute)
app.route('/seats', seatRoute)
app.route('/matches', matchRoute)
app.route('/pricing', pricingRoute)
app.route('/sportmonks', sportmonksRoute)
app.route('/tickets', ticketRoute)

export const GET = handle(app)
export const POST = handle(app)
export const PATCH = handle(app)
export const PUT = handle(app)
export const DELETE = handle(app)
