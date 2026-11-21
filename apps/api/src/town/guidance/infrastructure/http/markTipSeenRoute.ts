import { createRoute, type OpenAPIHono } from '@hono/zod-openapi'
import { MarkTipSeenSchema } from '@mygame/contracts'
import { ok } from '@mygame/domain'
import {
  type RequirePlayerDependencies,
  requirePlayer,
} from '#account/infrastructure/http/requirePlayer'
import { answerRefusal } from '#platform/infrastructure/http/answerRefusal'
import { honoPathOf } from '#platform/infrastructure/http/honoPath'
import { malformedResponse } from '#platform/infrastructure/http/responseDeclarations'
import { signedInRoute } from '#platform/infrastructure/http/signedInRoute'
import type { MutateTownDependencies } from '../../../application/mutateTown'
import { answerGuidanceChange } from './answerGuidanceChange'

export const markTipSeenDeclaration = createRoute(
  signedInRoute({
    method: 'post',
    path: '/tips/{tip}',
    request: { params: MarkTipSeenSchema },
    responses: {
      204: { description: 'The tip is marked seen; marking it again changes nothing.' },
      400: malformedResponse('tip'),
    },
  }),
)

export type MarkTipSeenRouteDependencies = RequirePlayerDependencies & MutateTownDependencies

export const markTipSeenRoute = (
  routes: OpenAPIHono,
  dependencies: MarkTipSeenRouteDependencies,
): void => {
  routes.openAPIRegistry.registerPath(markTipSeenDeclaration)
  routes.on(
    markTipSeenDeclaration.method,
    honoPathOf(markTipSeenDeclaration),
    requirePlayer(dependencies),
    async (c) => {
      const request = MarkTipSeenSchema.safeParse(c.req.param())
      if (!request.success) {
        return answerRefusal(c, { kind: 'MalformedRequest' })
      }
      const playerId = c.var.playerId
      return answerGuidanceChange(
        c,
        playerId,
        async (stores) => {
          await stores.seenTips.markSeen(playerId, request.data.tip)
          return ok(undefined)
        },
        dependencies,
      )
    },
  )
}
