import { createRoute, type OpenAPIHono } from '@hono/zod-openapi'
import { type ReviewHint, ReviewHintSchema, ReviewRequestSchema } from '@mygame/contracts'
import {
  type RequirePlayerDependencies,
  requirePlayer,
} from '#account/infrastructure/http/requirePlayer'
import { honoPathOf } from '#platform/infrastructure/http/honoPath'
import { refusalResponse } from '#platform/infrastructure/http/refusalResponse'
import { answerRefusal } from '#platform/infrastructure/http/respondRefusal'
import { jsonResponse, malformedResponse } from '#platform/infrastructure/http/responseDeclarations'
import { signedInRoute } from '#platform/infrastructure/http/signedInRoute'
import type { LearningDependencies } from '../../application/LearningDependencies'
import { requestReviewHint } from '../../application/requestReviewHint'

export const requestReviewHintDeclaration = createRoute(
  signedInRoute({
    method: 'post',
    path: '/{wordId}/hint',
    request: { params: ReviewRequestSchema },
    responses: {
      200: jsonResponse(
        'The first letter and the letter count of the word a due recall asks for.',
        ReviewHintSchema.meta({ id: 'ReviewHint' }),
      ),
      400: malformedResponse('path or body'),
      409: refusalResponse('UnknownWord, WordNotHeld or ReviewNotDue, or HintOnRecognition.'),
    },
  }),
)

export const requestReviewHintRoute = (
  routes: OpenAPIHono,
  dependencies: LearningDependencies & RequirePlayerDependencies,
): void => {
  routes.on(
    requestReviewHintDeclaration.method,
    honoPathOf(requestReviewHintDeclaration),
    requirePlayer(dependencies),
    async (c) => {
      const request = ReviewRequestSchema.safeParse(c.req.param())
      if (!request.success) {
        return answerRefusal(c, { kind: 'MalformedRequest' })
      }
      const hint = await requestReviewHint(c.var.playerId, request.data.wordId, dependencies)
      if (!hint.ok) {
        return answerRefusal(c, hint.error)
      }
      const body: ReviewHint = { words: [...hint.value.words] }
      return c.json(body)
    },
  )
}
