import { createRoute } from '@hono/zod-openapi'
import { type JobQuote, JobQuoteSchema, SendJobSchema } from '@mygame/contracts'
import type { QuoteJob } from '@mygame/domain'
import type { Context } from 'hono'
import type { SignedInPlayer } from '#account/infrastructure/http/requirePlayer'
import { readJsonBody } from '#platform/infrastructure/http/readJsonBody'
import { refusalResponse } from '#platform/infrastructure/http/refusalResponse'
import { respondRefusal } from '#platform/infrastructure/http/respondRefusal'
import { jsonBody, jsonResponse } from '#platform/infrastructure/http/responseDeclarations'
import { signedInDeclaration } from '#platform/infrastructure/http/signedInDeclaration'
import { townNotFoundResponse } from '../../../infrastructure/http/townComponents'

export const quoteJobDeclaration = createRoute(
  signedInDeclaration({
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

export type QuoteJobControllerDependencies = {
  readonly quoteJob: QuoteJob
}

export class QuoteJobController {
  constructor(private readonly dependencies: QuoteJobControllerDependencies) {}

  async handle(c: Context<SignedInPlayer>): Promise<Response> {
    const request = SendJobSchema.safeParse(await readJsonBody(c))
    if (!request.success) {
      return respondRefusal(c, { kind: 'MalformedRequest' })
    }
    const pay = await this.dependencies.quoteJob.execute({
      playerId: c.var.playerId,
      ...request.data,
    })
    if (!pay.ok) {
      return respondRefusal(c, pay.error)
    }
    const body: JobQuote = { pay: pay.value }
    return c.json(body)
  }
}
