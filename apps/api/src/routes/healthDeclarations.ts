import { createRoute } from '@hono/zod-openapi'
import { HealthResponseSchema } from '@mygame/contracts'
import { jsonResponse } from '../http/responseDeclarations'

export const healthDeclarations = {
  health: createRoute({
    method: 'get',
    path: '/health',
    responses: {
      200: jsonResponse(
        'The api is up; answered without reaching the database.',
        HealthResponseSchema.meta({ id: 'HealthResponse' }),
      ),
    },
  }),
}
