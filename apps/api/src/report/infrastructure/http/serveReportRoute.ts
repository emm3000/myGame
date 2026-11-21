import { createRoute, type OpenAPIHono } from '@hono/zod-openapi'
import { type Report, ReportSchema } from '@mygame/contracts'
import {
  type RequirePlayerDependencies,
  requirePlayer,
} from '#account/infrastructure/http/requirePlayer'
import { honoPathOf } from '#platform/infrastructure/http/honoPath'
import { respondRefusal } from '#platform/infrastructure/http/respondRefusal'
import { jsonResponse } from '#platform/infrastructure/http/responseDeclarations'
import { signedInRoute } from '#platform/infrastructure/http/signedInRoute'
import { type ServeReportDependencies, serveReport } from '../../application/serveReport'
import { presentReport } from './presentReport'

export const serveReportDeclaration = createRoute(
  signedInRoute({
    method: 'get',
    path: '/',
    responses: {
      200: jsonResponse(
        'The reviews due, then the Town News since the player last closed the Report; with no town, the reviews and no news.',
        ReportSchema,
      ),
    },
  }),
)

export type ServeReportRouteDependencies = RequirePlayerDependencies & ServeReportDependencies

export const serveReportRoute = (
  routes: OpenAPIHono,
  dependencies: ServeReportRouteDependencies,
): void => {
  routes.openAPIRegistry.registerPath(serveReportDeclaration)
  routes.on(
    serveReportDeclaration.method,
    honoPathOf(serveReportDeclaration),
    requirePlayer(dependencies),
    async (c) => {
      const report = await serveReport(c.var.playerId, dependencies)
      if (!report.ok) {
        return respondRefusal(c, report.error)
      }
      const body: Report = presentReport(report.value)
      return c.json(body)
    },
  )
}
