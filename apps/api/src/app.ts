import { OpenAPIHono } from '@hono/zod-openapi'
import type { HealthResponse } from '@mygame/contracts'
import {
  type AccountRouteDependencies,
  accountRoutes,
} from './account/infrastructure/http/accountRoutes'
import { holdoutCheckRoutes } from './holdout/infrastructure/http/holdoutCheckRoutes'
import {
  type LearningRouteDependencies,
  learningRoutes,
} from './learning/infrastructure/http/learningRoutes'
import {
  type PlacementRouteDependencies,
  placementRoutes,
} from './placement/infrastructure/http/placementRoutes'
import type { FailureSink } from './platform/application/ports/FailureSink'
import { healthDeclarations } from './platform/infrastructure/http/healthDeclarations'
import { honoPathOf } from './platform/infrastructure/http/honoPath'
import { reportServerFailures } from './platform/infrastructure/http/reportServerFailures'
import {
  sessionBearerScheme,
  sessionBearerSecurityScheme,
} from './platform/infrastructure/http/signedInRoute'
import {
  type ReportRouteDependencies,
  reportRoutes,
} from './report/infrastructure/http/reportRoutes'
import { type TownDependencies, townRoutes } from './town/infrastructure/http/townRoutes'
import {
  type TownMapDependencies,
  townMapRoutes,
} from './town/jobs/infrastructure/http/regionMapRoutes'

export type AppDependencies = AccountRouteDependencies &
  LearningRouteDependencies &
  PlacementRouteDependencies &
  ReportRouteDependencies &
  TownDependencies &
  TownMapDependencies & {
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
    .route('/', accountRoutes(dependencies))
    .route('/reviews', learningRoutes(dependencies))
    .route('/placement', placementRoutes(dependencies))
    .route('/holdout-checks', holdoutCheckRoutes(dependencies))
    .route('/report', reportRoutes(dependencies))
    .route('/town/map', townMapRoutes(dependencies))
    .route('/town', townRoutes(dependencies))
  app.doc('/openapi.json', {
    openapi: '3.0.0',
    info: { title: 'myGame api', version: '0.0.0' },
  })
  return app
}
