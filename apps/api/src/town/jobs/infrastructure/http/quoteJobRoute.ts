import { createRoute, type OpenAPIHono } from '@hono/zod-openapi'
import { type JobQuote, JobQuoteSchema, SendJobSchema } from '@mygame/contracts'
import {
  type RequirePlayerDependencies,
  requirePlayer,
} from '#account/infrastructure/http/requirePlayer'
import { honoPathOf } from '#platform/infrastructure/http/honoPath'
import { readJsonBody } from '#platform/infrastructure/http/readJsonBody'
import { refusalResponse } from '#platform/infrastructure/http/refusalResponse'
import { respondRefusal } from '#platform/infrastructure/http/respondRefusal'
import { jsonBody, jsonResponse } from '#platform/infrastructure/http/responseDeclarations'
import { signedInRoute } from '#platform/infrastructure/http/signedInDeclaration'
import { townNotFoundResponse } from '../../../infrastructure/http/townComponents'
import { type QuoteJobNowDependencies, quoteJobNow } from '../../application/quoteJobNow'

export const quoteJobDeclaration = createRoute(
  signedInRoute({
    method: 'post',
    path: '/jobs/quote',
    request: { body: jsonBody(SendJobSchema) },
    responses: {
      200: jsonResponse(
        'The pay the job would fix if it were sent at this instant; nothing is sent or stored.',
        JobQuoteSchema,
      ),
      400: refusalResponse(
        'InvalidTeam, JobHoursOutOfRange or JobSiteOutOfBounds; any other malformed body answers an empty body.',
      ),
      404: townNotFoundResponse,
      409: refusalResponse('TeamAlreadyOut, JobToOwnSite, SiteHeld or NotEnoughHiresAtHome.'),
    },
  }),
)

export type QuoteJobRouteDependencies = RequirePlayerDependencies & QuoteJobNowDependencies

export const quoteJobRoute = (
  routes: OpenAPIHono,
  dependencies: QuoteJobRouteDependencies,
): void => {
  routes.openAPIRegistry.registerPath(quoteJobDeclaration)
  routes.on(
    quoteJobDeclaration.method,
    honoPathOf(quoteJobDeclaration),
    requirePlayer(dependencies),
    async (c) => {
      const request = SendJobSchema.safeParse(await readJsonBody(c))
      if (!request.success) {
        return respondRefusal(c, { kind: 'MalformedRequest' })
      }
      const pay = await quoteJobNow({ playerId: c.var.playerId, ...request.data }, dependencies)
      if (!pay.ok) {
        return respondRefusal(c, pay.error)
      }
      const body: JobQuote = { pay: pay.value }
      return c.json(body)
    },
  )
}
