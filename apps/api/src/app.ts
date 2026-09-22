import type { HealthResponse } from '@mygame/contracts'
import { Hono } from 'hono'
import { type AuthDependencies, authRoutes } from './routes/auth'
import { type FiefDependencies, fiefRoutes } from './routes/fief'

export type AppDependencies = AuthDependencies & FiefDependencies

export const createApp = (dependencies: AppDependencies): Hono =>
  new Hono()
    .get('/health', (c) => {
      const body: HealthResponse = { status: 'ok' }
      return c.json(body)
    })
    .route('/auth', authRoutes(dependencies))
    .route('/fief', fiefRoutes(dependencies))
