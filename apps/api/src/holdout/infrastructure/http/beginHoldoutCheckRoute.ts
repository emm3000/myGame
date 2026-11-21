import { createRoute, type OpenAPIHono } from '@hono/zod-openapi'
import { HoldoutCheckRequestSchema } from '@mygame/contracts'
import { beginHoldoutCheck, type RandomSource } from '@mygame/domain'
import { readScaffold } from '../../../account/application/readScaffold'
import {
  type RequirePlayerDependencies,
  requirePlayer,
} from '../../../account/infrastructure/http/requirePlayer'
import type { LearningDependencies } from '../../../learning/LearningDependencies'
import { answerRefusal } from '../../../platform/infrastructure/http/answerRefusal'
import { honoPathOf } from '../../../platform/infrastructure/http/honoPath'
import { signedInRoute } from '../../../platform/infrastructure/http/signedInRoute'
import { answerHoldoutChecks } from './answerHoldoutChecks'
import { checkNotDue, checkPath, checksResponse, malformedCheck } from './holdoutCheckComponents'
import { readChecksAfter } from './readChecksAfter'

export const beginHoldoutCheckDeclaration = createRoute(
  signedInRoute({
    method: 'post',
    path: '/{band}/{week}',
    request: checkPath,
    responses: {
      200: checksResponse(
        'The check begun: the api drew its practised words and asks them beside the held-out ones; a check begun before keeps its words.',
      ),
      400: malformedCheck,
      409: checkNotDue,
    },
  }),
)

export type BeginHoldoutCheckRouteDependencies = LearningDependencies &
  RequirePlayerDependencies & {
    readonly random: RandomSource
  }

export const beginHoldoutCheckRoute = (
  routes: OpenAPIHono,
  dependencies: BeginHoldoutCheckRouteDependencies,
): void => {
  const { lessons, random } = dependencies
  routes.openAPIRegistry.registerPath(beginHoldoutCheckDeclaration)
  routes.on(
    beginHoldoutCheckDeclaration.method,
    honoPathOf(beginHoldoutCheckDeclaration),
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
        async (stores, { band, week }, at) =>
          beginHoldoutCheck(
            { playerId, band, week, scaffold: await readScaffold(playerId, stores.accounts) },
            { ...stores, lessons, words: lessons, random, clock: at },
          ),
        dependencies,
      )
      return answerHoldoutChecks(c, views)
    },
  )
}
