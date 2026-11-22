import { OpenAPIHono } from '@hono/zod-openapi'
import {
  type RequirePlayerDependencies,
  requirePlayer,
} from '#account/infrastructure/http/requirePlayer'
import { honoPathOf } from '#platform/infrastructure/http/honoPath'
import {
  RequestReviewHintController,
  type RequestReviewHintControllerDependencies,
  requestReviewHintDeclaration,
} from './RequestReviewHintController'
import {
  ServeDueReviewsController,
  type ServeDueReviewsControllerDependencies,
  serveDueReviewsDeclaration,
} from './ServeDueReviewsController'
import {
  SubmitReviewAnswerController,
  type SubmitReviewAnswerControllerDependencies,
  submitReviewAnswerDeclaration,
} from './SubmitReviewAnswerController'

export type LearningRouteDependencies = RequirePlayerDependencies &
  ServeDueReviewsControllerDependencies &
  RequestReviewHintControllerDependencies &
  SubmitReviewAnswerControllerDependencies

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
  const signedIn = requirePlayer(dependencies)
  const serveDueReviewsController = new ServeDueReviewsController(dependencies)
  const requestReviewHintController = new RequestReviewHintController(dependencies)
  const submitReviewAnswerController = new SubmitReviewAnswerController(dependencies)
  routes.on(
    serveDueReviewsDeclaration.method,
    honoPathOf(serveDueReviewsDeclaration),
    signedIn,
    (c) => serveDueReviewsController.handle(c),
  )
  routes.on(
    requestReviewHintDeclaration.method,
    honoPathOf(requestReviewHintDeclaration),
    signedIn,
    (c) => requestReviewHintController.handle(c),
  )
  routes.on(
    submitReviewAnswerDeclaration.method,
    honoPathOf(submitReviewAnswerDeclaration),
    signedIn,
    (c) => submitReviewAnswerController.handle(c),
  )
  return routes
}
