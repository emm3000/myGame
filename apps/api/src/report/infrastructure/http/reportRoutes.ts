import { OpenAPIHono } from '@hono/zod-openapi'
import {
  type CloseReportRouteDependencies,
  closeReportDeclaration,
  closeReportRoute,
} from './closeReportRoute'
import {
  type ServeReportRouteDependencies,
  serveReportDeclaration,
  serveReportRoute,
} from './serveReportRoute'

export type ReportRouteDependencies = ServeReportRouteDependencies & CloseReportRouteDependencies

export const reportDeclarations = {
  read: serveReportDeclaration,
  close: closeReportDeclaration,
}

export const reportRoutes = (dependencies: ReportRouteDependencies): OpenAPIHono => {
  const routes = new OpenAPIHono()
  serveReportRoute(routes, dependencies)
  closeReportRoute(routes, dependencies)
  return routes
}
