import { createRoute } from '@hono/zod-openapi'
import { ResetPasswordRequestSchema } from '@mygame/contracts'
import type { ResetPassword } from '@mygame/domain'
import type { Context } from 'hono'
import { readJsonBody } from '#platform/infrastructure/http/readJsonBody'
import { refusalResponse } from '#platform/infrastructure/http/refusalResponse'
import { requestRefusalOf } from '#platform/infrastructure/http/requestRefusalOf'
import { respondRefusal } from '#platform/infrastructure/http/respondRefusal'
import { jsonBody } from '#platform/infrastructure/http/responseDeclarations'
import { accountIssues } from './accountIssues'
import { respondDone } from './respondDone'

export const resetPasswordDeclaration = createRoute({
  method: 'post',
  path: '/auth/reset-password',
  request: {
    body: jsonBody(ResetPasswordRequestSchema.meta({ id: 'ResetPasswordRequest' })),
  },
  responses: {
    204: { description: 'The password is replaced and every session closed.' },
    400: refusalResponse('TokenInvalid or WeakPassword; a malformed body answers an empty body.'),
  },
})

export type ResetPasswordControllerDependencies = {
  readonly resetPassword: ResetPassword
}

export class ResetPasswordController {
  constructor(private readonly dependencies: ResetPasswordControllerDependencies) {}

  async handle(c: Context): Promise<Response> {
    const request = ResetPasswordRequestSchema.safeParse(await readJsonBody(c))
    if (!request.success) {
      return respondRefusal(c, requestRefusalOf(accountIssues, request.error.issues))
    }
    return respondDone(c, await this.dependencies.resetPassword.execute(request.data))
  }
}
