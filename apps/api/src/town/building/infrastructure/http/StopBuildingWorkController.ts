import { createRoute } from '@hono/zod-openapi'
import { StopBuildingWorkSchema } from '@mygame/contracts'
import type { StopBuildingWork } from '@mygame/domain'
import type { Context } from 'hono'
import type { SignedInPlayer } from '#account/infrastructure/http/requirePlayer'
import { refusalResponse } from '#platform/infrastructure/http/refusalResponse'
import { respondRefusal } from '#platform/infrastructure/http/respondRefusal'
import { malformedResponse } from '#platform/infrastructure/http/responseDeclarations'
import { signedInDeclaration } from '#platform/infrastructure/http/signedInDeclaration'
import {
  type RespondTownReadingDependencies,
  respondTownReading,
} from '../../../infrastructure/http/respondTownReading'
import { overviewResponse, townNotFoundResponse } from '../../../infrastructure/http/townComponents'

export const stopBuildingWorkDeclaration = createRoute(
  signedInDeclaration({
    method: 'delete',
    path: '/work/{building}/{level}',
    request: { params: StopBuildingWorkSchema },
    responses: {
      200: overviewResponse('The town with the work stopped and its cost refunded in full.'),
      400: malformedResponse('path'),
      404: townNotFoundResponse,
      409: refusalResponse('BuildingWorkNotFound.'),
    },
  }),
)

export type StopBuildingWorkControllerDependencies = RespondTownReadingDependencies & {
  readonly stopBuildingWork: StopBuildingWork
}

export class StopBuildingWorkController {
  constructor(private readonly dependencies: StopBuildingWorkControllerDependencies) {}

  async handle(c: Context<SignedInPlayer>): Promise<Response> {
    const request = StopBuildingWorkSchema.safeParse(c.req.param())
    if (!request.success) {
      return respondRefusal(c, { kind: 'MalformedRequest' })
    }
    const changed = await this.dependencies.stopBuildingWork.execute({
      playerId: c.var.playerId,
      ...request.data,
    })
    return respondTownReading(c, changed, this.dependencies)
  }
}
