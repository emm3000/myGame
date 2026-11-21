import { createRoute, type OpenAPIHono } from '@hono/zod-openapi'
import { HoldoutCheckRequestSchema } from '@mygame/contracts'
import { skipHoldoutCheck } from '@mygame/domain'
import {
  type RequirePlayerDependencies,
  requirePlayer,
} from '#account/infrastructure/http/requirePlayer'
import type { LearningDependencies } from '#learning/application/LearningDependencies'
import { answerRefusal } from '#platform/infrastructure/http/answerRefusal'
import { honoPathOf } from '#platform/infrastructure/http/honoPath'
import { signedInRoute } from '#platform/infrastructure/http/signedInRoute'
import { answerHoldoutChecks } from './answerHoldoutChecks'
import { checkNotDue, checkPath, checksResponse, malformedCheck } from './holdoutCheckComponents'
import { readChecksAfter } from './readChecksAfter'

export const skipHoldoutCheckDeclaration = createRoute(
  signedInRoute({
    method: 'post',
    path: '/{band}/{week}/skip',
    request: checkPath,
    responses: {
      200: checksResponse(
        'The check skipped for good; a skipped 24-week check releases the band’s held-out words.',
      ),
      400: malformedCheck,
      409: checkNotDue,
    },
  }),
)

export type SkipHoldoutCheckRouteDependencies = LearningDependencies & RequirePlayerDependencies

export const skipHoldoutCheckRoute = (
  routes: OpenAPIHono,
  dependencies: SkipHoldoutCheckRouteDependencies,
): void => {
  routes.openAPIRegistry.registerPath(skipHoldoutCheckDeclaration)
  routes.on(
    skipHoldoutCheckDeclaration.method,
    honoPathOf(skipHoldoutCheckDeclaration),
    requirePlayer(dependencies),
    async (c) => {
      const check = HoldoutCheckRequestSchema.safeParse(c.req.param())
      if (!check.success) {
        return answerRefusal(c, { kind: 'MalformedRequest' })
      }
      const playerId = c.var.playerId
      const views = await readChecksAfter(
        playerId,
        check.data,
        (stores, { band, week }, at) =>
          skipHoldoutCheck({ playerId, band, week }, { bandStarts: stores.bandStarts, clock: at }),
        dependencies,
      )
      return answerHoldoutChecks(c, views)
    },
  )
}
