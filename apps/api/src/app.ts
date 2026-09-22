import type { HealthResponse } from '@mygame/contracts'
import { Hono } from 'hono'

export const app: Hono = new Hono().get('/health', (c) => {
  const body: HealthResponse = { status: 'ok' }
  return c.json(body)
})
