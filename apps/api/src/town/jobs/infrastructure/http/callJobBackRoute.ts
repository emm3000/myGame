import { createRoute, type OpenAPIHono } from '@hono/zod-openapi'
import { CallJobBackSchema } from '@mygame/contracts'
import { callJobBack, Instant, ok } from '@mygame/domain'
import {
  type RequirePlayerDependencies,
  requirePlayer,
} from '#account/infrastructure/http/requirePlayer'
import { honoPathOf } from '#platform/infrastructure/http/honoPath'
import { refusalResponse } from '#platform/infrastructure/http/refusalResponse'
import { respondRefusal } from '#platform/infrastructure/http/respondRefusal'
import { malformedResponse } from '#platform/infrastructure/http/responseDeclarations'
import { signedInRoute } from '#platform/infrastructure/http/signedInRoute'
import {
  type RespondTownChangeDependencies,
  respondTownChange,
} from '../../../infrastructure/http/respondTownChange'
import { overviewResponse, townNotFoundResponse } from '../../../infrastructure/http/townComponents'

export const callJobBackDeclaration = createRoute(
  signedInRoute({
    method: 'post',
    path: '/jobs/{sentAt}/call-back',
    request: { params: CallJobBackSchema },
    responses: {
      200: overviewResponse(
        'The town with the team on its way back, its pay cut to the work done before the call.',
      ),
      400: malformedResponse('path'),
      404: townNotFoundResponse,
      409: refusalResponse('JobNotFound or JobAlreadyReturning.'),
    },
  }),
)

export type CallJobBackRouteDependencies = RequirePlayerDependencies & RespondTownChangeDependencies

export const callJobBackRoute = (
  routes: OpenAPIHono,
  dependencies: CallJobBackRouteDependencies,
): void => {
  routes.openAPIRegistry.registerPath(callJobBackDeclaration)
  routes.on(
    callJobBackDeclaration.method,
    honoPathOf(callJobBackDeclaration),
    requirePlayer(dependencies),
    async (c) => {
      const request = CallJobBackSchema.safeParse(c.req.param())
      if (!request.success) {
        return respondRefusal(c, { kind: 'MalformedRequest' })
      }
      const playerId = c.var.playerId
      const sentAt = Instant.fromEpochMilliseconds(Date.parse(request.data.sentAt))
      return respondTownChange(
        c,
        playerId,
        async (stores, clock) => {
          const town = await callJobBack(
            { playerId, sentAt },
            {
              towns: stores.towns,
              cleanUps: stores.cleanUps,
              news: stores.townNews,
              catalog: dependencies.townCatalog,
              clock,
            },
          )
          return town.ok ? ok(clock.now()) : town
        },
        dependencies,
      )
    },
  )
}
