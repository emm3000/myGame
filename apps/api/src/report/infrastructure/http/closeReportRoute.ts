import { createRoute, type OpenAPIHono } from '@hono/zod-openapi'
import {
  type RequirePlayerDependencies,
  requirePlayer,
} from '#account/infrastructure/http/requirePlayer'
import { honoPathOf } from '#platform/infrastructure/http/honoPath'
import { signedInRoute } from '#platform/infrastructure/http/signedInDeclaration'
import type { ReportClosings } from '../../application/ports/ReportClosings'

export const closeReportDeclaration = createRoute(
  signedInRoute({
    method: 'post',
    path: '/close',
    responses: {
      204: { description: 'The Report is closed at the clock instant.' },
    },
  }),
)

export type CloseReportRouteDependencies = RequirePlayerDependencies & {
  readonly reportClosings: ReportClosings
}

export const closeReportRoute = (
  routes: OpenAPIHono,
  dependencies: CloseReportRouteDependencies,
): void => {
  routes.openAPIRegistry.registerPath(closeReportDeclaration)
  routes.on(
    closeReportDeclaration.method,
    honoPathOf(closeReportDeclaration),
    requirePlayer(dependencies),
    async (c) => {
      await dependencies.reportClosings.close(c.var.playerId)
      return c.body(null, 204)
    },
  )
}
