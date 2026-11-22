import type { OpenAPIHono } from '@hono/zod-openapi'
import { HealthController } from './HealthController'
import { healthDeclarations } from './healthDeclarations'
import { honoPathOf } from './honoPath'

export const healthRoutes = (routes: OpenAPIHono): void => {
  const healthController = new HealthController({ status: 'ok' })
  routes.openAPIRegistry.registerPath(healthDeclarations.health)
  routes.on(healthDeclarations.health.method, honoPathOf(healthDeclarations.health), (c) =>
    healthController.handle(c),
  )
}
