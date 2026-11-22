import { createRoute } from '@hono/zod-openapi'
import { VerifyEmailRequestSchema } from '@mygame/contracts'
import type { VerifyEmail } from '@mygame/domain'
import type { Context } from 'hono'
import { readJsonBody } from '#platform/infrastructure/http/readJsonBody'
import { refusalResponse } from '#platform/infrastructure/http/refusalResponse'
import { respondRefusal } from '#platform/infrastructure/http/respondRefusal'
import { jsonBody } from '#platform/infrastructure/http/responseDeclarations'
import { respondDone } from './respondDone'

export const verifyEmailDeclaration = createRoute({
  method: 'post',
  path: '/auth/verify-email',
  request: { body: jsonBody(VerifyEmailRequestSchema.meta({ id: 'VerifyEmailRequest' })) },
  responses: {
    204: {
      description:
        'The email is verified; a link redeemed earlier answers the same inside its 24 hours.',
    },
    400: refusalResponse('TokenInvalid; a malformed body answers an empty body.'),
  },
})

export type VerifyEmailControllerDependencies = {
  readonly verifyEmail: VerifyEmail
}

export class VerifyEmailController {
  constructor(private readonly dependencies: VerifyEmailControllerDependencies) {}

  async handle(c: Context): Promise<Response> {
    const request = VerifyEmailRequestSchema.safeParse(await readJsonBody(c))
    if (!request.success) {
      return respondRefusal(c, { kind: 'MalformedRequest' })
    }
    return respondDone(c, await this.dependencies.verifyEmail.execute(request.data))
  }
}
