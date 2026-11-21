import { createRoute, type OpenAPIHono } from '@hono/zod-openapi'
import { StopHiringOrderSchema } from '@mygame/contracts'
import { Instant, ok, stopHiringOrder } from '@mygame/domain'
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

export const stopHiringOrderDeclaration = createRoute(
  signedInRoute({
    method: 'delete',
    path: '/hiring/{hire}/{startedAt}',
    request: { params: StopHiringOrderSchema },
    responses: {
      200: overviewResponse(
        'The town with the hiring order stopped: the delivered hires kept, the rest refunded in full.',
      ),
      400: malformedResponse('path'),
      404: townNotFoundResponse,
      409: refusalResponse('HiringOrderNotFound.'),
    },
  }),
)

export type StopHiringOrderRouteDependencies = RequirePlayerDependencies &
  AnswerTownChangeDependencies

export const stopHiringOrderRoute = (
  routes: OpenAPIHono,
  dependencies: StopHiringOrderRouteDependencies,
): void => {
  routes.openAPIRegistry.registerPath(stopHiringOrderDeclaration)
  routes.on(
    stopHiringOrderDeclaration.method,
    honoPathOf(stopHiringOrderDeclaration),
    requirePlayer(dependencies),
    async (c) => {
      const request = StopHiringOrderSchema.safeParse(c.req.param())
      if (!request.success) {
        return answerRefusal(c, { kind: 'MalformedRequest' })
      }
      const playerId = c.var.playerId
      const { hire, startedAt } = request.data
      return answerTownChange(
        c,
        playerId,
        async (stores, clock) => {
          const change = await stopHiringOrder(
            { playerId, hire, startedAt: Instant.fromEpochMilliseconds(Date.parse(startedAt)) },
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
