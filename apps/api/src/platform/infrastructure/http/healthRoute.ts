import type { OpenAPIHono } from '@hono/zod-openapi'
import type { HealthResponse } from '@mygame/contracts'
import { healthDeclarations } from './healthDeclarations'
import { honoPathOf } from './honoPath'

export const healthRoute = (routes: OpenAPIHono): void => {
  routes.openAPIRegistry.registerPath(healthDeclarations.health)
  routes.on(healthDeclarations.health.method, honoPathOf(healthDeclarations.health), (c) => {
    const body: HealthResponse = { status: 'ok' }
    return c.json(body)
  })
}
