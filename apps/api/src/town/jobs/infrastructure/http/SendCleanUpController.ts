import { createRoute } from '@hono/zod-openapi'
import { SendCleanUpSchema } from '@mygame/contracts'
import type { SendCleanUp } from '@mygame/domain'
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

export const sendCleanUpDeclaration = createRoute(
  signedInDeclaration({
    method: 'post',
    path: '/clean-ups',
    request: { body: jsonBody(SendCleanUpSchema) },
    responses: {
      200: overviewResponse(
        'The town with the team out on the clean-up, its pay fixed at dispatch: none when its strength falls short of the waste.',
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

export type SendCleanUpControllerDependencies = RespondTownReadingDependencies & {
  readonly sendCleanUp: SendCleanUp
}

export class SendCleanUpController {
  constructor(private readonly dependencies: SendCleanUpControllerDependencies) {}

  async handle(c: Context<SignedInPlayer>): Promise<Response> {
    const request = SendCleanUpSchema.safeParse(await readJsonBody(c))
    if (!request.success) {
      return respondRefusal(c, { kind: 'MalformedRequest' })
    }
    const changed = await this.dependencies.sendCleanUp.execute({
      playerId: c.var.playerId,
      ...request.data,
    })
    return respondTownReading(c, changed, this.dependencies)
  }
}
