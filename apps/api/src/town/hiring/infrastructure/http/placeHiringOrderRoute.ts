import { createRoute, type OpenAPIHono } from '@hono/zod-openapi'
import { PlaceHiringOrderSchema } from '@mygame/contracts'
import { ok, placeHiringOrder } from '@mygame/domain'
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
  malformedResponse,
} from '../../../../platform/infrastructure/http/responseDeclarations'
import { signedInRoute } from '../../../../platform/infrastructure/http/signedInRoute'
import {
  type AnswerTownChangeDependencies,
  answerTownChange,
} from '../../../infrastructure/http/answerTownChange'
import { overviewResponse, townNotFoundResponse } from '../../../infrastructure/http/townComponents'

export const placeHiringOrderDeclaration = createRoute(
  signedInRoute({
    method: 'post',
    path: '/hiring',
    request: { body: jsonBody(PlaceHiringOrderSchema) },
    responses: {
      200: overviewResponse('The town with the hiring order placed, paid and staffed in full.'),
      400: malformedResponse('body'),
      404: townNotFoundResponse,
      409: refusalResponse('OfficeTooLow, HiringSlotBusy, NotEnoughPeople or NotEnoughResources.'),
    },
  }),
)

export type PlaceHiringOrderRouteDependencies = RequirePlayerDependencies &
  AnswerTownChangeDependencies

export const placeHiringOrderRoute = (
  routes: OpenAPIHono,
  dependencies: PlaceHiringOrderRouteDependencies,
): void => {
  routes.openAPIRegistry.registerPath(placeHiringOrderDeclaration)
  routes.on(
    placeHiringOrderDeclaration.method,
    honoPathOf(placeHiringOrderDeclaration),
    requirePlayer(dependencies),
    async (c) => {
      const request = PlaceHiringOrderSchema.safeParse(await readJsonBody(c))
      if (!request.success) {
        return answerRefusal(c, { kind: 'MalformedRequest' })
      }
      const playerId = c.var.playerId
      return answerTownChange(
        c,
        playerId,
        async (stores, clock) => {
          const town = await placeHiringOrder(
            { playerId, ...request.data },
            {
              towns: stores.towns,
              news: stores.townNews,
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
