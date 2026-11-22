import { createRoute } from '@hono/zod-openapi'
import { HoldoutCheckAnswersSchema, HoldoutCheckRequestSchema } from '@mygame/contracts'
import type { AnswerHoldoutCheck } from '@mygame/domain'
import type { Context } from 'hono'
import type { SignedInPlayer } from '#account/infrastructure/http/requirePlayer'
import { readJsonBody } from '#platform/infrastructure/http/readJsonBody'
import { respondRefusal } from '#platform/infrastructure/http/respondRefusal'
import { jsonBody } from '#platform/infrastructure/http/responseDeclarations'
import { signedInDeclaration } from '#platform/infrastructure/http/signedInDeclaration'
import { checkNotDue, checkPath, checksResponse } from './holdoutCheckComponents'
import { respondHoldoutChecks } from './respondHoldoutChecks'

export const answerHoldoutCheckDeclaration = createRoute(
  signedInDeclaration({
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

export type AnswerHoldoutCheckControllerDependencies = {
  readonly answerHoldoutCheck: AnswerHoldoutCheck
}

export class AnswerHoldoutCheckController {
  constructor(private readonly dependencies: AnswerHoldoutCheckControllerDependencies) {}

  async handle(c: Context<SignedInPlayer>): Promise<Response> {
    const check = HoldoutCheckRequestSchema.safeParse(c.req.param())
    const request = HoldoutCheckAnswersSchema.safeParse(await readJsonBody(c))
    if (!check.success || !request.success) {
      return respondRefusal(c, { kind: 'MalformedRequest' })
    }
    const views = await this.dependencies.answerHoldoutCheck.execute({
      playerId: c.var.playerId,
      ...check.data,
      answers: request.data.answers,
    })
    return respondHoldoutChecks(c, views)
  }
}
