import { OpenAPIHono } from '@hono/zod-openapi'
import {
  type RequirePlayerDependencies,
  requirePlayer,
} from '#account/infrastructure/http/requirePlayer'
import { honoPathOf } from '#platform/infrastructure/http/honoPath'
import {
  CloseReportController,
  type CloseReportControllerDependencies,
  closeReportDeclaration,
} from './CloseReportController'
import {
  ServeReportController,
  type ServeReportControllerDependencies,
  serveReportDeclaration,
} from './ServeReportController'

export type ReportRouteDependencies = RequirePlayerDependencies &
  ServeReportControllerDependencies &
  CloseReportControllerDependencies

export const reportDeclarations = {
  read: serveReportDeclaration,
  close: closeReportDeclaration,
}

export const reportRoutes = (dependencies: ReportRouteDependencies): OpenAPIHono => {
  const routes = new OpenAPIHono()
  const signedIn = requirePlayer(dependencies)
  const serveReportController = new ServeReportController(dependencies)
  const closeReportController = new CloseReportController(dependencies)
  routes.openAPIRegistry.registerPath(serveReportDeclaration)
  routes.on(serveReportDeclaration.method, honoPathOf(serveReportDeclaration), signedIn, (c) =>
    serveReportController.handle(c),
  )
  routes.openAPIRegistry.registerPath(closeReportDeclaration)
  routes.on(closeReportDeclaration.method, honoPathOf(closeReportDeclaration), signedIn, (c) =>
    closeReportController.handle(c),
  )
  return routes
}
