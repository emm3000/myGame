import { OpenAPIHono } from '@hono/zod-openapi'
import type { HealthResponse } from '@mygame/contracts'
import type { FailureSink } from './http/FailureSink'
import { honoPathOf } from './http/honoPath'
import { reportServerFailures } from './http/reportServerFailures'
import { sessionBearerScheme, sessionBearerSecurityScheme } from './http/responseDeclarations'
import { type AuthDependencies, authRoutes } from './routes/auth'
import { healthDeclarations } from './routes/healthDeclarations'
import { type LearningRouteDependencies, learningRoutes } from './routes/learning'
import { type ReportRouteDependencies, reportRoutes } from './routes/report'
import { type TownDependencies, townRoutes } from './routes/town'

export type AppDependencies = AuthDependencies &
  LearningRouteDependencies &
  ReportRouteDependencies &
  TownDependencies & {
    readonly failureSink: FailureSink
  }

export const createApp = (dependencies: AppDependencies): OpenAPIHono => {
  const app = new OpenAPIHono()
  app.use(reportServerFailures(dependencies.failureSink))
  app.onError((_error, c) => c.body(null, 500))
  app.openAPIRegistry.registerComponent(
    'securitySchemes',
    sessionBearerScheme,
    sessionBearerSecurityScheme,
  )
  app.openAPIRegistry.registerPath(healthDeclarations.health)
  app.on(healthDeclarations.health.method, honoPathOf(healthDeclarations.health), (c) => {
    const body: HealthResponse = { status: 'ok' }
    return c.json(body)
  })
  app
    .route('/auth', authRoutes(dependencies))
    .route('/reviews', learningRoutes(dependencies))
    .route('/report', reportRoutes(dependencies))
    .route('/town', townRoutes(dependencies))
  app.doc('/openapi.json', {
    openapi: '3.0.0',
    info: { title: 'myGame api', version: '0.0.0' },
  })
  return app
}
