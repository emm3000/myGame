import { createRoute } from '@hono/zod-openapi'
import { type ReviewHint, ReviewHintSchema, ReviewRequestSchema } from '@mygame/contracts'
import type { RequestReviewHint } from '@mygame/domain'
import type { Context } from 'hono'
import type { SignedInPlayer } from '#account/infrastructure/http/requirePlayer'
import { refusalResponse } from '#platform/infrastructure/http/refusalResponse'
import { respondRefusal } from '#platform/infrastructure/http/respondRefusal'
import { jsonResponse, malformedResponse } from '#platform/infrastructure/http/responseDeclarations'
import { signedInDeclaration } from '#platform/infrastructure/http/signedInDeclaration'

export const requestReviewHintDeclaration = createRoute(
  signedInDeclaration({
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

export type RequestReviewHintControllerDependencies = {
  readonly requestReviewHint: RequestReviewHint
}

export class RequestReviewHintController {
  constructor(private readonly dependencies: RequestReviewHintControllerDependencies) {}

  async handle(c: Context<SignedInPlayer>): Promise<Response> {
    const request = ReviewRequestSchema.safeParse(c.req.param())
    if (!request.success) {
      return respondRefusal(c, { kind: 'MalformedRequest' })
    }
    const hint = await this.dependencies.requestReviewHint.execute({
      playerId: c.var.playerId,
      wordId: request.data.wordId,
    })
    if (!hint.ok) {
      return respondRefusal(c, hint.error)
    }
    const body: ReviewHint = { words: [...hint.value.words] }
    return c.json(body)
  }
}
