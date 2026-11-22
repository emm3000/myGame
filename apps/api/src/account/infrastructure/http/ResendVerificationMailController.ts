import { createRoute } from '@hono/zod-openapi'
import type { ResendVerificationMail } from '@mygame/domain'
import type { Context } from 'hono'
import { refusalResponse } from '#platform/infrastructure/http/refusalResponse'
import { signedInDeclaration } from '#platform/infrastructure/http/signedInDeclaration'
import type { SignedInPlayer } from './requirePlayer'
import { respondDone } from './respondDone'

export const resendVerificationMailDeclaration = createRoute(
  signedInDeclaration({
    method: 'post',
    path: '/auth/verify-email/resend',
    responses: {
      204: { description: 'The verification mail is sent, or the email is already verified.' },
      503: refusalResponse('MailNotSent.'),
    },
  }),
)

export type ResendVerificationMailControllerDependencies = {
  readonly resendVerificationMail: ResendVerificationMail
}

export class ResendVerificationMailController {
  constructor(private readonly dependencies: ResendVerificationMailControllerDependencies) {}

  async handle(c: Context<SignedInPlayer>): Promise<Response> {
    return respondDone(c, await this.dependencies.resendVerificationMail.execute(c.var.playerId))
  }
}
