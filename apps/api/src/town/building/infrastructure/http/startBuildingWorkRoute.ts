import { createRoute, type OpenAPIHono } from '@hono/zod-openapi'
import { StartBuildingWorkSchema } from '@mygame/contracts'
import { ok, startBuildingWork } from '@mygame/domain'
import {
  type RequirePlayerDependencies,
  requirePlayer,
} from '#account/infrastructure/http/requirePlayer'
import { honoPathOf } from '#platform/infrastructure/http/honoPath'
import { readJsonBody } from '#platform/infrastructure/http/readJsonBody'
import { refusalResponse } from '#platform/infrastructure/http/refusalResponse'
import { respondRefusal } from '#platform/infrastructure/http/respondRefusal'
import { jsonBody, malformedResponse } from '#platform/infrastructure/http/responseDeclarations'
import { signedInRoute } from '#platform/infrastructure/http/signedInRoute'
import {
  type RespondTownChangeDependencies,
  respondTownChange,
} from '../../../infrastructure/http/respondTownChange'
import { overviewResponse, townNotFoundResponse } from '../../../infrastructure/http/townComponents'

export const startBuildingWorkDeclaration = createRoute(
  signedInRoute({
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

export type StartBuildingWorkRouteDependencies = RequirePlayerDependencies &
  RespondTownChangeDependencies

export const startBuildingWorkRoute = (
  routes: OpenAPIHono,
  dependencies: StartBuildingWorkRouteDependencies,
): void => {
  routes.openAPIRegistry.registerPath(startBuildingWorkDeclaration)
  routes.on(
    startBuildingWorkDeclaration.method,
    honoPathOf(startBuildingWorkDeclaration),
    requirePlayer(dependencies),
    async (c) => {
      const request = StartBuildingWorkSchema.safeParse(await readJsonBody(c))
      if (!request.success) {
        return respondRefusal(c, { kind: 'MalformedRequest' })
      }
      const playerId = c.var.playerId
      return respondTownChange(
        c,
        playerId,
        async (stores, clock) => {
          const town = await startBuildingWork(
            { playerId, building: request.data.building },
            {
              towns: stores.towns,
              news: stores.townNews,
              cards: stores.cards,
              catalog: dependencies.townCatalog,
              clock,
            },
          )
          return town.ok ? ok(town.value.storedAt) : town
        },
        dependencies,
      )
    },
  )
}
