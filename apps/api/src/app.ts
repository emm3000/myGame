import type { HealthResponse } from '@mygame/contracts'
import { Hono } from 'hono'
import { type AuthDependencies, authRoutes } from './routes/auth'

export type AppDependencies = AuthDependencies

export const createApp = (dependencies: AppDependencies): Hono =>
  new Hono()
    .get('/health', (c) => {
      const body: HealthResponse = { status: 'ok' }
      return c.json(body)
    })
    .route('/auth', authRoutes(dependencies))
