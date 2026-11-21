import { createRoute, type OpenAPIHono } from '@hono/zod-openapi'
import {
  type ReviewAnswer,
  ReviewAnswerRequestSchema,
  ReviewAnswerSchema,
  ReviewRequestSchema,
} from '@mygame/contracts'
import {
  type RequirePlayerDependencies,
  requirePlayer,
} from '#account/infrastructure/http/requirePlayer'
import { honoPathOf } from '#platform/infrastructure/http/honoPath'
import { readJsonBody } from '#platform/infrastructure/http/readJsonBody'
import { refusalResponse } from '#platform/infrastructure/http/refusalResponse'
import { respondRefusal } from '#platform/infrastructure/http/respondRefusal'
import {
  jsonBody,
  jsonResponse,
  malformedResponse,
} from '#platform/infrastructure/http/responseDeclarations'
import { signedInRoute } from '#platform/infrastructure/http/signedInDeclaration'
import type { LearningDependencies } from '../../application/LearningDependencies'
import { submitReviewAnswer } from '../../application/submitReviewAnswer'
import { presentReviewVerdict } from './presentReviewVerdict'

export const submitReviewAnswerDeclaration = createRoute(
  signedInRoute({
    method: 'post',
    path: '/{wordId}/answer',
    request: {
      params: ReviewRequestSchema,
      body: jsonBody(ReviewAnswerRequestSchema.meta({ id: 'ReviewAnswerRequest' })),
    },
    responses: {
      200: jsonResponse(
        'The verdict the server graded; an earned skill carries the town’s rates, or null rates without a town.',
        ReviewAnswerSchema,
      ),
      400: malformedResponse('path or body'),
      409: refusalResponse('UnknownWord, WordNotHeld or ReviewNotDue, or UnknownChoice.'),
    },
  }),
)

export const submitReviewAnswerRoute = (
  routes: OpenAPIHono,
  dependencies: LearningDependencies & RequirePlayerDependencies,
): void => {
  routes.on(
    submitReviewAnswerDeclaration.method,
    honoPathOf(submitReviewAnswerDeclaration),
    requirePlayer(dependencies),
    async (c) => {
      const path = ReviewRequestSchema.safeParse(c.req.param())
      const request = ReviewAnswerRequestSchema.safeParse(await readJsonBody(c))
      if (!path.success || !request.success) {
        return respondRefusal(c, { kind: 'MalformedRequest' })
      }
      const outcome = await submitReviewAnswer(
        c.var.playerId,
        path.data.wordId,
        request.data.answer,
        dependencies,
      )
      if (!outcome.ok) {
        return respondRefusal(c, outcome.error)
      }
      const verdict = presentReviewVerdict(
        outcome.value,
        dependencies.townCatalog,
        dependencies.memoryTerms,
      )
      if (!verdict.ok) {
        return respondRefusal(c, verdict.error)
      }
      const body: ReviewAnswer = { verdict: verdict.value }
      return c.json(body)
    },
  )
}
