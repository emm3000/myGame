import { OpenAPIHono } from '@hono/zod-openapi'
import type { FailureSink } from '@mygame/domain'
import {
  type AccountRouteDependencies,
  accountRoutes,
} from '#account/infrastructure/http/accountRoutes'
import { holdoutCheckRoutes } from '#holdout/infrastructure/http/holdoutCheckRoutes'
import {
  type LearningRouteDependencies,
  learningRoutes,
} from '#learning/infrastructure/http/learningRoutes'
import {
  type PlacementRouteDependencies,
  placementRoutes,
} from '#placement/infrastructure/http/placementRoutes'
import { healthRoute } from '#platform/infrastructure/http/healthRoute'
import { reportServerFailures } from '#platform/infrastructure/http/reportServerFailures'
import {
  sessionBearerScheme,
  sessionBearerSecurityScheme,
} from '#platform/infrastructure/http/signedInDeclaration'
import {
  type ReportRouteDependencies,
  reportRoutes,
} from '#report/infrastructure/http/reportRoutes'
import { type TownRouteDependencies, townRoutes } from '#town/infrastructure/http/townRoutes'
import {
  type RegionMapRouteDependencies,
  regionMapRoutes,
} from '#town/jobs/infrastructure/http/regionMapRoutes'

export type AppDependencies = AccountRouteDependencies &
  LearningRouteDependencies &
  PlacementRouteDependencies &
  ReportRouteDependencies &
  TownRouteDependencies &
  RegionMapRouteDependencies & {
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
  healthRoute(app)
  app
    .route('/', accountRoutes(dependencies))
    .route('/reviews', learningRoutes(dependencies))
    .route('/placement', placementRoutes(dependencies))
    .route('/holdout-checks', holdoutCheckRoutes(dependencies))
    .route('/report', reportRoutes(dependencies))
    .route('/town/map', regionMapRoutes(dependencies))
    .route('/town', townRoutes(dependencies))
  app.doc('/openapi.json', {
    openapi: '3.0.0',
    info: { title: 'myGame api', version: '0.0.0' },
  })
  return app
}
