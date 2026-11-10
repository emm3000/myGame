import { OpenAPIHono } from '@hono/zod-openapi'
import type { Report } from '@mygame/contracts'
import { answerRefusal } from '../http/answerRefusal'
import { honoPathOf } from '../http/honoPath'
import { type RequirePlayerDependencies, requirePlayer } from '../http/requirePlayer'
import { type ReportDependencies, reportOf } from '../town/reportOf'
import { reportDeclarations } from './reportDeclarations'

export type ReportRouteDependencies = RequirePlayerDependencies & ReportDependencies

export const reportRoutes = (dependencies: ReportRouteDependencies): OpenAPIHono => {
  const signedInPlayer = requirePlayer(dependencies)
  const routes = new OpenAPIHono()
  for (const declaration of Object.values(reportDeclarations)) {
    routes.openAPIRegistry.registerPath(declaration)
  }
  routes.on(
    reportDeclarations.read.method,
    honoPathOf(reportDeclarations.read),
    signedInPlayer,
    async (c) => {
      const report = await reportOf(c.var.playerId, dependencies)
      if (!report.ok) {
        return answerRefusal(c, report.error)
      }
      const body: Report = report.value
      return c.json(body)
    },
  )
  routes.on(
    reportDeclarations.close.method,
    honoPathOf(reportDeclarations.close),
    signedInPlayer,
    async (c) => {
      await dependencies.reportClosings.close(c.var.playerId, dependencies.clock.now())
      return c.body(null, 204)
    },
  )
  return routes
}
