import { createRoute } from '@hono/zod-openapi'
import { SendJobSchema } from '@mygame/contracts'
import type { SendJob } from '@mygame/domain'
import type { Context } from 'hono'
import type { SignedInPlayer } from '#account/infrastructure/http/requirePlayer'
import { readJsonBody } from '#platform/infrastructure/http/readJsonBody'
import { refusalResponse } from '#platform/infrastructure/http/refusalResponse'
import { respondRefusal } from '#platform/infrastructure/http/respondRefusal'
import { jsonBody } from '#platform/infrastructure/http/responseDeclarations'
import { signedInDeclaration } from '#platform/infrastructure/http/signedInDeclaration'
import {
  type RespondTownReadingDependencies,
  respondTownReading,
} from '../../../infrastructure/http/respondTownReading'
import { overviewResponse, townNotFoundResponse } from '../../../infrastructure/http/townComponents'

export const sendJobDeclaration = createRoute(
  signedInDeclaration({
    method: 'post',
    path: '/jobs',
    request: { body: jsonBody(SendJobSchema) },
    responses: {
      200: overviewResponse('The town with the team out on the job, its pay fixed at dispatch.'),
      400: refusalResponse(
        'InvalidTeam, JobHoursOutOfRange or JobSiteOutOfBounds; any other malformed body answers an empty body.',
      ),
      404: townNotFoundResponse,
      409: refusalResponse('TeamAlreadyOut, JobToOwnSite, SiteHeld or NotEnoughHiresAtHome.'),
    },
  }),
)

export type SendJobControllerDependencies = RespondTownReadingDependencies & {
  readonly sendJob: SendJob
}

export class SendJobController {
  constructor(private readonly dependencies: SendJobControllerDependencies) {}

  async handle(c: Context<SignedInPlayer>): Promise<Response> {
    const request = SendJobSchema.safeParse(await readJsonBody(c))
    if (!request.success) {
      return respondRefusal(c, { kind: 'MalformedRequest' })
    }
    const changed = await this.dependencies.sendJob.execute({
      playerId: c.var.playerId,
      ...request.data,
    })
    return respondTownReading(c, changed, this.dependencies)
  }
}
