import { OpenAPIHono } from '@hono/zod-openapi'
import type { HealthResponse } from '@mygame/contracts'
import { honoPathOf } from './http/honoPath'
import { sessionBearerScheme, sessionBearerSecurityScheme } from './http/responseDeclarations'
import { type AuthDependencies, authRoutes } from './routes/auth'
import { type DigestDependencies, digestRoutes } from './routes/digest'
import { type FiefsDependencies, fiefsRoutes } from './routes/fiefs'
import { healthDeclarations } from './routes/healthDeclarations'
import { type HintsDependencies, hintsRoutes } from './routes/hints'

export type AppDependencies = AuthDependencies &
  FiefsDependencies &
  DigestDependencies &
  HintsDependencies

export const createApp = (dependencies: AppDependencies): OpenAPIHono => {
  const app = new OpenAPIHono()
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
    .route('/fiefs', fiefsRoutes(dependencies))
    .route('/digest', digestRoutes(dependencies))
    .route('/hints', hintsRoutes(dependencies))
  app.doc('/openapi.json', {
    openapi: '3.0.0',
    info: { title: 'myGame api', version: '0.0.0' },
  })
  return app
}
