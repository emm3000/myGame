import { OpenAPIHono } from '@hono/zod-openapi'
import {
  type RequirePlayerDependencies,
  requirePlayer,
} from '#account/infrastructure/http/requirePlayer'
import { honoPathOf } from '#platform/infrastructure/http/honoPath'
import {
  AnswerHoldoutCheckController,
  type AnswerHoldoutCheckControllerDependencies,
  answerHoldoutCheckDeclaration,
} from './AnswerHoldoutCheckController'
import {
  BeginHoldoutCheckController,
  type BeginHoldoutCheckControllerDependencies,
  beginHoldoutCheckDeclaration,
} from './BeginHoldoutCheckController'
import {
  ReadHoldoutChecksController,
  type ReadHoldoutChecksControllerDependencies,
  readHoldoutChecksDeclaration,
} from './ReadHoldoutChecksController'
import {
  SkipHoldoutCheckController,
  type SkipHoldoutCheckControllerDependencies,
  skipHoldoutCheckDeclaration,
} from './SkipHoldoutCheckController'

export type HoldoutCheckRouteDependencies = RequirePlayerDependencies &
  ReadHoldoutChecksControllerDependencies &
  BeginHoldoutCheckControllerDependencies &
  AnswerHoldoutCheckControllerDependencies &
  SkipHoldoutCheckControllerDependencies

export const holdoutCheckRoutes = (dependencies: HoldoutCheckRouteDependencies): OpenAPIHono => {
  const routes = new OpenAPIHono()
  const signedIn = requirePlayer(dependencies)
  const readHoldoutChecksController = new ReadHoldoutChecksController(dependencies)
  const beginHoldoutCheckController = new BeginHoldoutCheckController(dependencies)
  const answerHoldoutCheckController = new AnswerHoldoutCheckController(dependencies)
  const skipHoldoutCheckController = new SkipHoldoutCheckController(dependencies)
  routes.openAPIRegistry.registerPath(readHoldoutChecksDeclaration)
  routes.on(
    readHoldoutChecksDeclaration.method,
    honoPathOf(readHoldoutChecksDeclaration),
    signedIn,
    (c) => readHoldoutChecksController.handle(c),
  )
  routes.openAPIRegistry.registerPath(beginHoldoutCheckDeclaration)
  routes.on(
    beginHoldoutCheckDeclaration.method,
    honoPathOf(beginHoldoutCheckDeclaration),
    signedIn,
    (c) => beginHoldoutCheckController.handle(c),
  )
  routes.openAPIRegistry.registerPath(answerHoldoutCheckDeclaration)
  routes.on(
    answerHoldoutCheckDeclaration.method,
    honoPathOf(answerHoldoutCheckDeclaration),
    signedIn,
    (c) => answerHoldoutCheckController.handle(c),
  )
  routes.openAPIRegistry.registerPath(skipHoldoutCheckDeclaration)
  routes.on(
    skipHoldoutCheckDeclaration.method,
    honoPathOf(skipHoldoutCheckDeclaration),
    signedIn,
    (c) => skipHoldoutCheckController.handle(c),
  )
  return routes
}
