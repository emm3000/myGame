import { OpenAPIHono } from '@hono/zod-openapi'
import {
  type RequirePlayerDependencies,
  requirePlayer,
} from '#account/infrastructure/http/requirePlayer'
import { honoPathOf } from '#platform/infrastructure/http/honoPath'
import {
  AnswerPlacementController,
  type AnswerPlacementControllerDependencies,
  answerPlacementDeclaration,
} from './AnswerPlacementController'
import {
  BeginPlacementController,
  type BeginPlacementControllerDependencies,
  beginPlacementDeclaration,
} from './BeginPlacementController'
import {
  ReadPlacementController,
  type ReadPlacementControllerDependencies,
  readPlacementDeclaration,
} from './ReadPlacementController'
import {
  SkipPlacementController,
  type SkipPlacementControllerDependencies,
  skipPlacementDeclaration,
} from './SkipPlacementController'

export type PlacementRouteDependencies = RequirePlayerDependencies &
  ReadPlacementControllerDependencies &
  BeginPlacementControllerDependencies &
  SkipPlacementControllerDependencies &
  AnswerPlacementControllerDependencies

export const placementRoutes = (dependencies: PlacementRouteDependencies): OpenAPIHono => {
  const routes = new OpenAPIHono()
  const signedIn = requirePlayer(dependencies)
  const readPlacementController = new ReadPlacementController(dependencies)
  const beginPlacementController = new BeginPlacementController(dependencies)
  const skipPlacementController = new SkipPlacementController(dependencies)
  const answerPlacementController = new AnswerPlacementController(dependencies)
  routes.openAPIRegistry.registerPath(readPlacementDeclaration)
  routes.on(readPlacementDeclaration.method, honoPathOf(readPlacementDeclaration), signedIn, (c) =>
    readPlacementController.handle(c),
  )
  routes.openAPIRegistry.registerPath(beginPlacementDeclaration)
  routes.on(
    beginPlacementDeclaration.method,
    honoPathOf(beginPlacementDeclaration),
    signedIn,
    (c) => beginPlacementController.handle(c),
  )
  routes.openAPIRegistry.registerPath(skipPlacementDeclaration)
  routes.on(skipPlacementDeclaration.method, honoPathOf(skipPlacementDeclaration), signedIn, (c) =>
    skipPlacementController.handle(c),
  )
  routes.openAPIRegistry.registerPath(answerPlacementDeclaration)
  routes.on(
    answerPlacementDeclaration.method,
    honoPathOf(answerPlacementDeclaration),
    signedIn,
    (c) => answerPlacementController.handle(c),
  )
  return routes
}
