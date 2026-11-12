import { OpenAPIHono } from '@hono/zod-openapi'
import {
  type ReviewAnswer,
  ReviewAnswerRequestSchema,
  type ReviewHint,
  ReviewRequestSchema,
  type Reviews,
} from '@mygame/contracts'
import { answerRefusal } from '../http/answerRefusal'
import { bodyOf } from '../http/bodyOf'
import { honoPathOf } from '../http/honoPath'
import { type RequirePlayerDependencies, requirePlayer } from '../http/requirePlayer'
import { answerReviewOf } from '../learning/answerReviewOf'
import type { LearningDependencies } from '../learning/LearningDependencies'
import { requestHintOf } from '../learning/requestHintOf'
import { reviewsOf } from '../learning/reviewsOf'
import { reviewVerdictOf } from '../learning/reviewVerdictOf'
import { mutateTown } from '../town/mutateTown'
import { learningDeclarations } from './learningDeclarations'

export type LearningRouteDependencies = LearningDependencies & RequirePlayerDependencies

export const learningRoutes = (dependencies: LearningRouteDependencies): OpenAPIHono => {
  const signedInPlayer = requirePlayer(dependencies)
  const routes = new OpenAPIHono()
  for (const declaration of Object.values(learningDeclarations)) {
    routes.openAPIRegistry.registerPath(declaration)
  }
  routes.on(
    learningDeclarations.reviews.method,
    honoPathOf(learningDeclarations.reviews),
    signedInPlayer,
    async (c) => {
      const playerId = c.var.playerId
      const reviews = await mutateTown(
        playerId,
        (stores, clock) => reviewsOf(playerId, stores, clock, dependencies),
        dependencies,
      )
      if (!reviews.ok) {
        return answerRefusal(c, reviews.error)
      }
      const body: Reviews = reviews.value
      return c.json(body)
    },
  )
  routes.on(
    learningDeclarations.requestHint.method,
    honoPathOf(learningDeclarations.requestHint),
    signedInPlayer,
    async (c) => {
      const request = ReviewRequestSchema.safeParse(c.req.param())
      if (!request.success) {
        return answerRefusal(c, { kind: 'MalformedRequest' })
      }
      const hint = await requestHintOf(c.var.playerId, request.data.wordId, dependencies)
      if (!hint.ok) {
        return answerRefusal(c, hint.error)
      }
      const body: ReviewHint = { words: [...hint.value.words] }
      return c.json(body)
    },
  )
  routes.on(
    learningDeclarations.answerReview.method,
    honoPathOf(learningDeclarations.answerReview),
    signedInPlayer,
    async (c) => {
      const path = ReviewRequestSchema.safeParse(c.req.param())
      const request = ReviewAnswerRequestSchema.safeParse(await bodyOf(c))
      if (!path.success || !request.success) {
        return answerRefusal(c, { kind: 'MalformedRequest' })
      }
      const outcome = await answerReviewOf(
        c.var.playerId,
        path.data.wordId,
        request.data.answer,
        dependencies,
      )
      if (!outcome.ok) {
        return answerRefusal(c, outcome.error)
      }
      const verdict = reviewVerdictOf(
        outcome.value,
        dependencies.townCatalog,
        dependencies.memoryTerms,
      )
      if (!verdict.ok) {
        return answerRefusal(c, verdict.error)
      }
      const body: ReviewAnswer = { verdict: verdict.value }
      return c.json(body)
    },
  )
  return routes
}
