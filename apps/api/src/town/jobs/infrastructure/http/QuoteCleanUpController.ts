import { createRoute } from '@hono/zod-openapi'
import { type CleanUpQuote, CleanUpQuoteSchema, SendCleanUpSchema } from '@mygame/contracts'
import type { QuoteCleanUp } from '@mygame/domain'
import type { Context } from 'hono'
import type { SignedInPlayer } from '#account/infrastructure/http/requirePlayer'
import { readJsonBody } from '#platform/infrastructure/http/readJsonBody'
import { refusalResponse } from '#platform/infrastructure/http/refusalResponse'
import { respondRefusal } from '#platform/infrastructure/http/respondRefusal'
import { jsonBody, jsonResponse } from '#platform/infrastructure/http/responseDeclarations'
import { signedInDeclaration } from '#platform/infrastructure/http/signedInDeclaration'
import { townNotFoundResponse } from '../../../infrastructure/http/townComponents'

export const quoteCleanUpDeclaration = createRoute(
  signedInDeclaration({
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

export type QuoteCleanUpControllerDependencies = {
  readonly quoteCleanUp: QuoteCleanUp
}

export class QuoteCleanUpController {
  constructor(private readonly dependencies: QuoteCleanUpControllerDependencies) {}

  async handle(c: Context<SignedInPlayer>): Promise<Response> {
    const request = SendCleanUpSchema.safeParse(await readJsonBody(c))
    if (!request.success) {
      return respondRefusal(c, { kind: 'MalformedRequest' })
    }
    const quote = await this.dependencies.quoteCleanUp.execute({
      playerId: c.var.playerId,
      ...request.data,
    })
    if (!quote.ok) {
      return respondRefusal(c, quote.error)
    }
    const body: CleanUpQuote = quote.value
    return c.json(body)
  }
}
