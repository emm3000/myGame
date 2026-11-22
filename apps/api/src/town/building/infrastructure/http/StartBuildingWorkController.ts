import { createRoute } from '@hono/zod-openapi'
import { StartBuildingWorkSchema } from '@mygame/contracts'
import type { StartBuildingWork } from '@mygame/domain'
import type { Context } from 'hono'
import type { SignedInPlayer } from '#account/infrastructure/http/requirePlayer'
import { readJsonBody } from '#platform/infrastructure/http/readJsonBody'
import { refusalResponse } from '#platform/infrastructure/http/refusalResponse'
import { respondRefusal } from '#platform/infrastructure/http/respondRefusal'
import { jsonBody, malformedResponse } from '#platform/infrastructure/http/responseDeclarations'
import { signedInDeclaration } from '#platform/infrastructure/http/signedInDeclaration'
import {
  type RespondTownReadingDependencies,
  respondTownReading,
} from '../../../infrastructure/http/respondTownReading'
import { overviewResponse, townNotFoundResponse } from '../../../infrastructure/http/townComponents'

export const startBuildingWorkDeclaration = createRoute(
  signedInDeclaration({
    method: 'post',
    path: '/work',
    request: { body: jsonBody(StartBuildingWorkSchema) },
    responses: {
      200: overviewResponse('The town with the work started in the slot or on the waiting list.'),
      400: malformedResponse('body'),
      404: townNotFoundResponse,
      409: refusalResponse(
        'WaitingListFull, TopLevelReached, NotEnoughPeople, NotEnoughWords or NotEnoughResources.',
      ),
    },
  }),
)

export type StartBuildingWorkControllerDependencies = RespondTownReadingDependencies & {
  readonly startBuildingWork: StartBuildingWork
}

export class StartBuildingWorkController {
  constructor(private readonly dependencies: StartBuildingWorkControllerDependencies) {}

  async handle(c: Context<SignedInPlayer>): Promise<Response> {
    const request = StartBuildingWorkSchema.safeParse(await readJsonBody(c))
    if (!request.success) {
      return respondRefusal(c, { kind: 'MalformedRequest' })
    }
    const changed = await this.dependencies.startBuildingWork.execute({
      playerId: c.var.playerId,
      building: request.data.building,
    })
    return respondTownReading(c, changed, this.dependencies)
  }
}
