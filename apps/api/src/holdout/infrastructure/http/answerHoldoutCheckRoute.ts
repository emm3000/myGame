import { createRoute, type OpenAPIHono } from '@hono/zod-openapi'
import { HoldoutCheckAnswersSchema, HoldoutCheckRequestSchema } from '@mygame/contracts'
import { answerHoldoutCheck } from '@mygame/domain'
import { readScaffold } from '#account/application/readScaffold'
import {
  type RequirePlayerDependencies,
  requirePlayer,
} from '#account/infrastructure/http/requirePlayer'
import type { LearningDependencies } from '#learning/application/LearningDependencies'
import { honoPathOf } from '#platform/infrastructure/http/honoPath'
import { readJsonBody } from '#platform/infrastructure/http/readJsonBody'
import { respondRefusal } from '#platform/infrastructure/http/respondRefusal'
import { jsonBody } from '#platform/infrastructure/http/responseDeclarations'
import { signedInRoute } from '#platform/infrastructure/http/signedInRoute'
import { mutateHoldoutCheck } from '../../application/mutateHoldoutCheck'
import { checkNotDue, checkPath, checksResponse } from './holdoutCheckComponents'
import { respondHoldoutChecks } from './respondHoldoutChecks'

export const answerHoldoutCheckDeclaration = createRoute(
  signedInRoute({
    method: 'post',
    path: '/{band}/{week}/answers',
    request: { ...checkPath, body: jsonBody(HoldoutCheckAnswersSchema) },
    responses: {
      200: checksResponse('The check taken: its held-out and practised scores stored.'),
      400: {
        description:
          'A malformed path or body, or InvalidHoldoutCheckAnswers: not one offered choice for each asked word. Empty body.',
      },
      409: {
        description: `${checkNotDue.description} Or HoldoutCheckNotBegun: the check is due but not begun.`,
      },
    },
  }),
)

export type AnswerHoldoutCheckRouteDependencies = LearningDependencies & RequirePlayerDependencies

export const answerHoldoutCheckRoute = (
  routes: OpenAPIHono,
  dependencies: AnswerHoldoutCheckRouteDependencies,
): void => {
  const { lessons } = dependencies
  routes.openAPIRegistry.registerPath(answerHoldoutCheckDeclaration)
  routes.on(
    answerHoldoutCheckDeclaration.method,
    honoPathOf(answerHoldoutCheckDeclaration),
    requirePlayer(dependencies),
    async (c) => {
      const check = HoldoutCheckRequestSchema.safeParse(c.req.param())
      const request = HoldoutCheckAnswersSchema.safeParse(await readJsonBody(c))
      if (!check.success || !request.success) {
        return respondRefusal(c, { kind: 'MalformedRequest' })
      }
      const playerId = c.var.playerId
      const views = await mutateHoldoutCheck(
        { playerId, ...check.data },
        async (stores, { band, week }, at) =>
          answerHoldoutCheck(
            {
              playerId,
              band,
              week,
              answers: request.data.answers,
              scaffold: await readScaffold(playerId, stores.accounts),
            },
            { bandStarts: stores.bandStarts, words: lessons, clock: at },
          ),
        dependencies,
      )
      return respondHoldoutChecks(c, views)
    },
  )
}
