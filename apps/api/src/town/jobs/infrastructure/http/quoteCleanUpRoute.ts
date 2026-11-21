import { createRoute, type OpenAPIHono } from '@hono/zod-openapi'
import { type CleanUpQuote, CleanUpQuoteSchema, SendCleanUpSchema } from '@mygame/contracts'
import {
  type RequirePlayerDependencies,
  requirePlayer,
} from '../../../../account/infrastructure/http/requirePlayer'
import { answerRefusal } from '../../../../platform/infrastructure/http/answerRefusal'
import { honoPathOf } from '../../../../platform/infrastructure/http/honoPath'
import { readJsonBody } from '../../../../platform/infrastructure/http/readJsonBody'
import { refusalResponse } from '../../../../platform/infrastructure/http/refusalResponse'
import {
  jsonBody,
  jsonResponse,
} from '../../../../platform/infrastructure/http/responseDeclarations'
import { signedInRoute } from '../../../../platform/infrastructure/http/signedInRoute'
import { townNotFoundResponse } from '../../../infrastructure/http/townComponents'
import {
  type QuoteCleanUpNowDependencies,
  quoteCleanUpNow,
} from '../../application/quoteCleanUpNow'

export const quoteCleanUpDeclaration = createRoute(
  signedInRoute({
    method: 'post',
    path: '/clean-ups/quote',
    request: { body: jsonBody(SendCleanUpSchema) },
    responses: {
      200: jsonResponse(
        "The team's strength, the site's waste and the pay the clean-up would fix if it were sent at this instant; nothing is sent or stored.",
        CleanUpQuoteSchema,
      ),
      400: refusalResponse(
        'InvalidTeam or JobSiteOutOfBounds; any other malformed body answers an empty body.',
      ),
      404: townNotFoundResponse,
      409: refusalResponse(
        'TeamAlreadyOut, JobToOwnSite, SiteHeld, NotAWasteSite, NoWasteYet or NotEnoughHiresAtHome.',
      ),
    },
  }),
)

export type QuoteCleanUpRouteDependencies = RequirePlayerDependencies & QuoteCleanUpNowDependencies

export const quoteCleanUpRoute = (
  routes: OpenAPIHono,
  dependencies: QuoteCleanUpRouteDependencies,
): void => {
  routes.openAPIRegistry.registerPath(quoteCleanUpDeclaration)
  routes.on(
    quoteCleanUpDeclaration.method,
    honoPathOf(quoteCleanUpDeclaration),
    requirePlayer(dependencies),
    async (c) => {
      const request = SendCleanUpSchema.safeParse(await readJsonBody(c))
      if (!request.success) {
        return answerRefusal(c, { kind: 'MalformedRequest' })
      }
      const quote = await quoteCleanUpNow(
        { playerId: c.var.playerId, ...request.data },
        dependencies,
      )
      if (!quote.ok) {
        return answerRefusal(c, quote.error)
      }
      const body: CleanUpQuote = quote.value
      return c.json(body)
    },
  )
}
