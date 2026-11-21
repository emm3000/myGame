import { createRoute, type OpenAPIHono } from '@hono/zod-openapi'
import { ForgotPasswordRequestSchema } from '@mygame/contracts'
import { readJsonBody } from '#platform/infrastructure/http/readJsonBody'
import { answerRefusal } from '#platform/infrastructure/http/respondRefusal'
import { jsonBody } from '#platform/infrastructure/http/responseDeclarations'
import {
  type RequestPasswordResetDependencies,
  requestPasswordReset,
} from '../../application/requestPasswordReset'

export const requestPasswordResetDeclaration = createRoute({
  method: 'post',
  path: '/auth/forgot-password',
  request: {
    body: jsonBody(ForgotPasswordRequestSchema.meta({ id: 'ForgotPasswordRequest' })),
  },
  responses: {
    202: { description: 'Accepted for any well-formed email. Empty body.' },
    400: { description: 'A malformed body. Empty body.' },
  },
})

export const requestPasswordResetRoute = (
  routes: OpenAPIHono,
  dependencies: RequestPasswordResetDependencies,
): void => {
  routes.openAPIRegistry.registerPath(requestPasswordResetDeclaration)
  routes.on(
    requestPasswordResetDeclaration.method,
    requestPasswordResetDeclaration.path,
    async (c) => {
      const request = ForgotPasswordRequestSchema.safeParse(await readJsonBody(c))
      if (!request.success) {
        return answerRefusal(c, { kind: 'MalformedRequest' })
      }
      requestPasswordReset(request.data, dependencies)
      return c.body(null, 202)
    },
  )
}
