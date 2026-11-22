import type { OpenAPIHono } from '@hono/zod-openapi'
import {
  type RequirePlayerDependencies,
  requirePlayer,
} from '#account/infrastructure/http/requirePlayer'
import { honoPathOf } from '#platform/infrastructure/http/honoPath'
import {
  CallJobBackController,
  type CallJobBackControllerDependencies,
  callJobBackDeclaration,
} from './CallJobBackController'
import {
  QuoteCleanUpController,
  type QuoteCleanUpControllerDependencies,
  quoteCleanUpDeclaration,
} from './QuoteCleanUpController'
import {
  QuoteJobController,
  type QuoteJobControllerDependencies,
  quoteJobDeclaration,
} from './QuoteJobController'
import {
  SendCleanUpController,
  type SendCleanUpControllerDependencies,
  sendCleanUpDeclaration,
} from './SendCleanUpController'
import {
  SendJobController,
  type SendJobControllerDependencies,
  sendJobDeclaration,
} from './SendJobController'

export type JobsRouteDependencies = RequirePlayerDependencies &
  SendJobControllerDependencies &
  QuoteJobControllerDependencies &
  SendCleanUpControllerDependencies &
  QuoteCleanUpControllerDependencies &
  CallJobBackControllerDependencies

export const jobsRoutes = (routes: OpenAPIHono, dependencies: JobsRouteDependencies): void => {
  const signedIn = requirePlayer(dependencies)
  const sendJobController = new SendJobController(dependencies)
  const quoteJobController = new QuoteJobController(dependencies)
  const sendCleanUpController = new SendCleanUpController(dependencies)
  const quoteCleanUpController = new QuoteCleanUpController(dependencies)
  const callJobBackController = new CallJobBackController(dependencies)
  routes.openAPIRegistry.registerPath(sendJobDeclaration)
  routes.on(sendJobDeclaration.method, honoPathOf(sendJobDeclaration), signedIn, (c) =>
    sendJobController.handle(c),
  )
  routes.openAPIRegistry.registerPath(quoteJobDeclaration)
  routes.on(quoteJobDeclaration.method, honoPathOf(quoteJobDeclaration), signedIn, (c) =>
    quoteJobController.handle(c),
  )
  routes.openAPIRegistry.registerPath(sendCleanUpDeclaration)
  routes.on(sendCleanUpDeclaration.method, honoPathOf(sendCleanUpDeclaration), signedIn, (c) =>
    sendCleanUpController.handle(c),
  )
  routes.openAPIRegistry.registerPath(quoteCleanUpDeclaration)
  routes.on(quoteCleanUpDeclaration.method, honoPathOf(quoteCleanUpDeclaration), signedIn, (c) =>
    quoteCleanUpController.handle(c),
  )
  routes.openAPIRegistry.registerPath(callJobBackDeclaration)
  routes.on(callJobBackDeclaration.method, honoPathOf(callJobBackDeclaration), signedIn, (c) =>
    callJobBackController.handle(c),
  )
}
