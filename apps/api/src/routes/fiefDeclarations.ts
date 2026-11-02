import { createRoute } from '@hono/zod-openapi'
import { FiefOverviewSchema, FiefRequestSchema } from '@mygame/contracts'
import { refusalResponse } from '../http/refusalResponse'

const FiefOverviewComponent = FiefOverviewSchema.meta({ id: 'FiefOverview' })

export const fiefDeclarations = {
  overview: createRoute({
    method: 'get',
    path: '/',
    request: { params: FiefRequestSchema },
    responses: {
      200: {
        description: 'The fief the path names, accrued to the read; the session is renewed.',
        content: { 'application/json': { schema: FiefOverviewComponent } },
      },
      400: { description: 'A fief id that is not a uuid. Empty body.' },
      401: { description: 'No live session cookie. Empty body.' },
      404: refusalResponse('FiefNotFound, for an unknown fief or another lord’s.'),
    },
  }),
}
