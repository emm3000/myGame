import { createRoute, type OpenAPIHono } from '@hono/zod-openapi'
import { type Reviews, ReviewsSchema } from '@mygame/contracts'
import { mutateTown } from '@mygame/domain'
import {
  type RequirePlayerDependencies,
  requirePlayer,
} from '#account/infrastructure/http/requirePlayer'
import { honoPathOf } from '#platform/infrastructure/http/honoPath'
import { respondRefusal } from '#platform/infrastructure/http/respondRefusal'
import { jsonResponse } from '#platform/infrastructure/http/responseDeclarations'
import { signedInDeclaration } from '#platform/infrastructure/http/signedInDeclaration'
import type { LearningDependencies } from '../../application/LearningDependencies'
import { serveDueReviews } from '../../application/serveDueReviews'
import { presentReviews } from './presentReviews'

export const serveDueReviewsDeclaration = createRoute(
  signedInDeclaration({
    method: 'get',
    path: '/',
    responses: {
      200: jsonResponse(
        'The player’s due reviews and the next due instant, after a finished lesson enters its cards.',
        ReviewsSchema,
      ),
    },
  }),
)

export const serveDueReviewsRoute = (
  routes: OpenAPIHono,
  dependencies: LearningDependencies & RequirePlayerDependencies,
): void => {
  routes.on(
    serveDueReviewsDeclaration.method,
    honoPathOf(serveDueReviewsDeclaration),
    requirePlayer(dependencies),
    async (c) => {
      const playerId = c.var.playerId
      const reviews = await mutateTown(
        playerId,
        (stores, clock) => serveDueReviews(playerId, stores, clock, dependencies),
        dependencies,
      )
      if (!reviews.ok) {
        return respondRefusal(c, reviews.error)
      }
      const body: Reviews = presentReviews(reviews.value)
      return c.json(body)
    },
  )
}
