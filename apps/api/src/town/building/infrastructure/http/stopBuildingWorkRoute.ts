import { createRoute, type OpenAPIHono } from '@hono/zod-openapi'
import { StopBuildingWorkSchema } from '@mygame/contracts'
import { ok, stopBuildingWork } from '@mygame/domain'
import {
  type RequirePlayerDependencies,
  requirePlayer,
} from '../../../../account/infrastructure/http/requirePlayer'
import { answerRefusal } from '../../../../platform/infrastructure/http/answerRefusal'
import { honoPathOf } from '../../../../platform/infrastructure/http/honoPath'
import { refusalResponse } from '../../../../platform/infrastructure/http/refusalResponse'
import { malformedResponse } from '../../../../platform/infrastructure/http/responseDeclarations'
import { signedInRoute } from '../../../../platform/infrastructure/http/signedInRoute'
import {
  type AnswerTownChangeDependencies,
  answerTownChange,
} from '../../../infrastructure/http/answerTownChange'
import { overviewResponse, townNotFoundResponse } from '../../../infrastructure/http/townComponents'

export const stopBuildingWorkDeclaration = createRoute(
  signedInRoute({
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

export type StopBuildingWorkRouteDependencies = RequirePlayerDependencies &
  AnswerTownChangeDependencies

export const stopBuildingWorkRoute = (
  routes: OpenAPIHono,
  dependencies: StopBuildingWorkRouteDependencies,
): void => {
  routes.openAPIRegistry.registerPath(stopBuildingWorkDeclaration)
  routes.on(
    stopBuildingWorkDeclaration.method,
    honoPathOf(stopBuildingWorkDeclaration),
    requirePlayer(dependencies),
    async (c) => {
      const request = StopBuildingWorkSchema.safeParse(c.req.param())
      if (!request.success) {
        return answerRefusal(c, { kind: 'MalformedRequest' })
      }
      const playerId = c.var.playerId
      return answerTownChange(
        c,
        playerId,
        async (stores, clock) => {
          const change = await stopBuildingWork(
            { playerId, ...request.data },
            {
              towns: stores.towns,
              news: stores.townNews,
              catalog: dependencies.townCatalog,
              clock,
            },
          )
          return change.ok ? ok(change.value.town.storedAt) : change
        },
        dependencies,
      )
    },
  )
}
