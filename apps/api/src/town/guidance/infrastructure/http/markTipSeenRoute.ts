import { createRoute, type OpenAPIHono } from '@hono/zod-openapi'
import { MarkTipSeenSchema } from '@mygame/contracts'
import type { MutateTownDependencies } from '@mygame/domain'
import { ok } from '@mygame/domain'
import {
  type RequirePlayerDependencies,
  requirePlayer,
} from '#account/infrastructure/http/requirePlayer'
import { honoPathOf } from '#platform/infrastructure/http/honoPath'
import { respondRefusal } from '#platform/infrastructure/http/respondRefusal'
import { malformedResponse } from '#platform/infrastructure/http/responseDeclarations'
import { signedInDeclaration } from '#platform/infrastructure/http/signedInDeclaration'
import { respondGuidanceChange } from './respondGuidanceChange'

export const markTipSeenDeclaration = createRoute(
  signedInDeclaration({
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
        return respondRefusal(c, { kind: 'MalformedRequest' })
      }
      const playerId = c.var.playerId
      return respondGuidanceChange(
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
