import type { HealthResponse } from '@mygame/contracts'
import { Hono } from 'hono'
import { type AuthDependencies, authRoutes } from './routes/auth'
import { type DigestDependencies, digestRoutes } from './routes/digest'
import { type FiefsDependencies, fiefsRoutes } from './routes/fiefs'
import { type HintsDependencies, hintsRoutes } from './routes/hints'

export type AppDependencies = AuthDependencies &
  FiefsDependencies &
  DigestDependencies &
  HintsDependencies

export const createApp = (dependencies: AppDependencies): Hono =>
  new Hono()
    .get('/health', (c) => {
      const body: HealthResponse = { status: 'ok' }
      return c.json(body)
    })
    .route('/auth', authRoutes(dependencies))
    .route('/fiefs', fiefsRoutes(dependencies))
    .route('/digest', digestRoutes(dependencies))
    .route('/hints', hintsRoutes(dependencies))
