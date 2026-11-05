import { createRoute } from '@hono/zod-openapi'
import {
  ReviewAnswerRequestSchema,
  ReviewAnswerSchema,
  ReviewHintSchema,
  ReviewRequestSchema,
  ReviewsSchema,
} from '@mygame/contracts'
import { type ResponseDeclaration, refusalResponse } from '../http/refusalResponse'
import { jsonBody, jsonResponse, signedInRoute } from '../http/responseDeclarations'

const reviewRefusals = 'UnknownWord, WordNotHeld or ReviewNotDue'

const malformedResponse: ResponseDeclaration = {
  description: 'A malformed path or body. Empty body.',
}

export const learningDeclarations = {
  reviews: createRoute(
    signedInRoute({
      method: 'get',
      path: '/',
      responses: {
        200: jsonResponse(
          'The player’s due reviews and the next due instant, after a finished lesson enters its cards.',
          ReviewsSchema,
        ),
      },
    }),
  ),
  requestHint: createRoute(
    signedInRoute({
      method: 'post',
      path: '/{wordId}/hint',
      request: { params: ReviewRequestSchema },
      responses: {
        200: jsonResponse(
          'The first letter and the letter count of the word a due recall asks for.',
          ReviewHintSchema.meta({ id: 'ReviewHint' }),
        ),
        400: malformedResponse,
        409: refusalResponse(`${reviewRefusals}, or HintOnRecognition.`),
      },
    }),
  ),
  answerReview: createRoute(
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
        400: malformedResponse,
        409: refusalResponse(`${reviewRefusals}, or UnknownChoice.`),
      },
    }),
  ),
}
