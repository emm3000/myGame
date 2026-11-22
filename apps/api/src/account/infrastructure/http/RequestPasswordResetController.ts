import { createRoute } from '@hono/zod-openapi'
import { ForgotPasswordRequestSchema } from '@mygame/contracts'
import type { RequestPasswordReset } from '@mygame/domain'
import type { Context } from 'hono'
import { readJsonBody } from '#platform/infrastructure/http/readJsonBody'
import { respondRefusal } from '#platform/infrastructure/http/respondRefusal'
import { jsonBody } from '#platform/infrastructure/http/responseDeclarations'

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

export type RequestPasswordResetControllerDependencies = {
  readonly requestPasswordReset: RequestPasswordReset
}

export class RequestPasswordResetController {
  constructor(private readonly dependencies: RequestPasswordResetControllerDependencies) {}

  async handle(c: Context): Promise<Response> {
    const request = ForgotPasswordRequestSchema.safeParse(await readJsonBody(c))
    if (!request.success) {
      return respondRefusal(c, { kind: 'MalformedRequest' })
    }
    await this.dependencies.requestPasswordReset.execute(request.data)
    return c.body(null, 202)
  }
}
