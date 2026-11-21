import { createRoute, type OpenAPIHono } from '@hono/zod-openapi'
import { PlacementAnswersSchema } from '@mygame/contracts'
import { answerPlacement } from '@mygame/domain'
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
import { signedInRoute } from '#platform/infrastructure/http/signedInDeclaration'
import { mutateTown } from '#town/application/mutateTown'
import { placementResponse } from './placementComponents'
import { respondPlacementView } from './respondPlacementView'

export const answerPlacementDeclaration = createRoute(
  signedInRoute({
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

export type AnswerPlacementRouteDependencies = LearningDependencies & RequirePlayerDependencies

export const answerPlacementRoute = (
  routes: OpenAPIHono,
  dependencies: AnswerPlacementRouteDependencies,
): void => {
  const { lessons } = dependencies
  routes.openAPIRegistry.registerPath(answerPlacementDeclaration)
  routes.on(
    answerPlacementDeclaration.method,
    honoPathOf(answerPlacementDeclaration),
    requirePlayer(dependencies),
    async (c) => {
      const request = PlacementAnswersSchema.safeParse(await readJsonBody(c))
      if (!request.success) {
        return respondRefusal(c, { kind: 'MalformedRequest' })
      }
      const playerId = c.var.playerId
      const view = await mutateTown(
        playerId,
        async (stores, clock) =>
          answerPlacement(
            {
              playerId,
              band: request.data.band,
              answers: request.data.answers,
              scaffold: await readScaffold(playerId, stores.accounts),
            },
            { placements: stores.placements, bandStarts: stores.bandStarts, words: lessons, clock },
          ),
        dependencies,
      )
      return respondPlacementView(c, view)
    },
  )
}
