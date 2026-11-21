import { createRoute, type OpenAPIHono } from '@hono/zod-openapi'
import {
  type RequirePlayerDependencies,
  requirePlayer,
} from '../../../../account/infrastructure/http/requirePlayer'
import { honoPathOf } from '../../../../platform/infrastructure/http/honoPath'
import { signedInRoute } from '../../../../platform/infrastructure/http/signedInRoute'
import type { MutateTownDependencies } from '../../../application/mutateTown'
import { townNotFoundResponse } from '../../../infrastructure/http/townComponents'
import { answerGuidanceChange } from './answerGuidanceChange'

export const dismissGuidanceDeclaration = createRoute(
  signedInRoute({
    method: 'post',
    path: '/guidance/dismissal',
    responses: {
      204: { description: 'The town’s guidance is dismissed; no read answers a goal again.' },
      404: townNotFoundResponse,
    },
  }),
)

export type DismissGuidanceRouteDependencies = RequirePlayerDependencies & MutateTownDependencies

export const dismissGuidanceRoute = (
  routes: OpenAPIHono,
  dependencies: DismissGuidanceRouteDependencies,
): void => {
  routes.openAPIRegistry.registerPath(dismissGuidanceDeclaration)
  routes.on(
    dismissGuidanceDeclaration.method,
    honoPathOf(dismissGuidanceDeclaration),
    requirePlayer(dependencies),
    async (c) => {
      const playerId = c.var.playerId
      return answerGuidanceChange(
        c,
        playerId,
        (stores, clock) => stores.guidanceDismissals.dismiss(playerId, clock.now()),
        dependencies,
      )
    },
  )
}
