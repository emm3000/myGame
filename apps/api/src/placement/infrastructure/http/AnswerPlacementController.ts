import { createRoute } from '@hono/zod-openapi'
import { PlacementAnswersSchema } from '@mygame/contracts'
import type { AnswerPlacement } from '@mygame/domain'
import type { Context } from 'hono'
import type { SignedInPlayer } from '#account/infrastructure/http/requirePlayer'
import { readJsonBody } from '#platform/infrastructure/http/readJsonBody'
import { respondRefusal } from '#platform/infrastructure/http/respondRefusal'
import { jsonBody } from '#platform/infrastructure/http/responseDeclarations'
import { signedInDeclaration } from '#platform/infrastructure/http/signedInDeclaration'
import { placementResponse } from './placementComponents'
import { respondPlacementView } from './respondPlacementView'

export const answerPlacementDeclaration = createRoute(
  signedInDeclaration({
    method: 'post',
    path: '/answers',
    request: { body: jsonBody(PlacementAnswersSchema) },
    responses: {
      200: placementResponse(
        'The band scored: the next band asked once it passes at 29 of 30, else the placement closed.',
      ),
      400: {
        description:
          'A malformed body, or InvalidPlacementAnswers: not one offered choice for each asked word. Empty body.',
      },
      409: {
        description: 'PlacementBandNotAsked: the check does not ask that band. Empty body.',
      },
    },
  }),
)

export type AnswerPlacementControllerDependencies = {
  readonly answerPlacement: AnswerPlacement
}

export class AnswerPlacementController {
  constructor(private readonly dependencies: AnswerPlacementControllerDependencies) {}

  async handle(c: Context<SignedInPlayer>): Promise<Response> {
    const request = PlacementAnswersSchema.safeParse(await readJsonBody(c))
    if (!request.success) {
      return respondRefusal(c, { kind: 'MalformedRequest' })
    }
    const view = await this.dependencies.answerPlacement.execute({
      playerId: c.var.playerId,
      band: request.data.band,
      answers: request.data.answers,
    })
    return respondPlacementView(c, view)
  }
}
