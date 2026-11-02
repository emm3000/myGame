import { OpenAPIHono } from '@hono/zod-openapi'
import type { HealthResponse } from '@mygame/contracts'
import { type AuthDependencies, authRoutes } from './routes/auth'
import { type DigestDependencies, digestRoutes } from './routes/digest'
import { type FiefsDependencies, fiefsRoutes } from './routes/fiefs'
import { type HintsDependencies, hintsRoutes } from './routes/hints'

export type AppDependencies = AuthDependencies &
  FiefsDependencies &
  DigestDependencies &
  HintsDependencies

export const createApp = (dependencies: AppDependencies): OpenAPIHono => {
  const app = new OpenAPIHono()
  app
    .get('/health', (c) => {
      const body: HealthResponse = { status: 'ok' }
      return c.json(body)
    })
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
