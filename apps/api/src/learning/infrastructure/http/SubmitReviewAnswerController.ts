import { createRoute } from '@hono/zod-openapi'
import {
  type ReviewAnswer,
  ReviewAnswerRequestSchema,
  ReviewAnswerSchema,
  ReviewRequestSchema,
} from '@mygame/contracts'
import type { MemoryTerms, SubmitReviewAnswer, TownCatalog } from '@mygame/domain'
import type { Context } from 'hono'
import type { SignedInPlayer } from '#account/infrastructure/http/requirePlayer'
import { readJsonBody } from '#platform/infrastructure/http/readJsonBody'
import { refusalResponse } from '#platform/infrastructure/http/refusalResponse'
import { respondRefusal } from '#platform/infrastructure/http/respondRefusal'
import {
  jsonBody,
  jsonResponse,
  malformedResponse,
} from '#platform/infrastructure/http/responseDeclarations'
import { signedInDeclaration } from '#platform/infrastructure/http/signedInDeclaration'
import { gatherReviewVerdict } from './gatherReviewVerdict'
import { presentReviewVerdict } from './presentReviewVerdict'

export const submitReviewAnswerDeclaration = createRoute(
  signedInDeclaration({
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

export type SubmitReviewAnswerControllerDependencies = {
  readonly submitReviewAnswer: SubmitReviewAnswer
  readonly townCatalog: TownCatalog
  readonly memoryTerms: MemoryTerms
}

export class SubmitReviewAnswerController {
  constructor(private readonly dependencies: SubmitReviewAnswerControllerDependencies) {}

  async handle(c: Context<SignedInPlayer>): Promise<Response> {
    const path = ReviewRequestSchema.safeParse(c.req.param())
    const request = ReviewAnswerRequestSchema.safeParse(await readJsonBody(c))
    if (!path.success || !request.success) {
      return respondRefusal(c, { kind: 'MalformedRequest' })
    }
    const { submitReviewAnswer, townCatalog, memoryTerms } = this.dependencies
    const outcome = await submitReviewAnswer.execute({
      playerId: c.var.playerId,
      wordId: path.data.wordId,
      answer: request.data.answer,
    })
    if (!outcome.ok) {
      return respondRefusal(c, outcome.error)
    }
    const verdict = gatherReviewVerdict(outcome.value, townCatalog, memoryTerms)
    if (!verdict.ok) {
      return respondRefusal(c, verdict.error)
    }
    const body: ReviewAnswer = { verdict: presentReviewVerdict(verdict.value) }
    return c.json(body)
  }
}
