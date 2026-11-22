import { createRoute } from '@hono/zod-openapi'
import { type Reviews, ReviewsSchema } from '@mygame/contracts'
import type { ServeDueReviews } from '@mygame/domain'
import type { Context } from 'hono'
import type { SignedInPlayer } from '#account/infrastructure/http/requirePlayer'
import { respondRefusal } from '#platform/infrastructure/http/respondRefusal'
import { jsonResponse } from '#platform/infrastructure/http/responseDeclarations'
import { signedInDeclaration } from '#platform/infrastructure/http/signedInDeclaration'
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

export type ServeDueReviewsControllerDependencies = {
  readonly serveDueReviews: ServeDueReviews
}

export class ServeDueReviewsController {
  constructor(private readonly dependencies: ServeDueReviewsControllerDependencies) {}

  async handle(c: Context<SignedInPlayer>): Promise<Response> {
    const reviews = await this.dependencies.serveDueReviews.execute({ playerId: c.var.playerId })
    if (!reviews.ok) {
      return respondRefusal(c, reviews.error)
    }
    const body: Reviews = presentReviews(reviews.value)
    return c.json(body)
  }
}
