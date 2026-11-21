import { OpenAPIHono } from '@hono/zod-openapi'
import type { RequirePlayerDependencies } from '#account/infrastructure/http/requirePlayer'
import type { LearningDependencies } from '../../application/LearningDependencies'
import { requestReviewHintDeclaration, requestReviewHintRoute } from './requestReviewHintRoute'
import { serveDueReviewsDeclaration, serveDueReviewsRoute } from './serveDueReviewsRoute'
import { submitReviewAnswerDeclaration, submitReviewAnswerRoute } from './submitReviewAnswerRoute'

export type LearningRouteDependencies = LearningDependencies & RequirePlayerDependencies

export const learningDeclarations = {
  reviews: serveDueReviewsDeclaration,
  requestHint: requestReviewHintDeclaration,
  answerReview: submitReviewAnswerDeclaration,
}

export const learningRoutes = (dependencies: LearningRouteDependencies): OpenAPIHono => {
  const routes = new OpenAPIHono()
  for (const declaration of Object.values(learningDeclarations)) {
    routes.openAPIRegistry.registerPath(declaration)
  }
  serveDueReviewsRoute(routes, dependencies)
  requestReviewHintRoute(routes, dependencies)
  submitReviewAnswerRoute(routes, dependencies)
  return routes
}
