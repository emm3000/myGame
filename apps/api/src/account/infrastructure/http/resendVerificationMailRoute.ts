import { createRoute, type OpenAPIHono } from '@hono/zod-openapi'
import { refusalResponse } from '#platform/infrastructure/http/refusalResponse'
import { signedInRoute } from '#platform/infrastructure/http/signedInRoute'
import {
  type ResendVerificationMailDependencies,
  resendVerificationMail,
} from '../../application/resendVerificationMail'
import { type RequirePlayerDependencies, requirePlayer } from './requirePlayer'
import { answerDone } from './respondDone'

export const resendVerificationMailDeclaration = createRoute(
  signedInRoute({
    method: 'post',
    path: '/auth/verify-email/resend',
    responses: {
      204: { description: 'The verification mail is sent, or the email is already verified.' },
      503: refusalResponse('MailNotSent.'),
    },
  }),
)

export type ResendVerificationMailRouteDependencies = RequirePlayerDependencies &
  ResendVerificationMailDependencies

export const resendVerificationMailRoute = (
  routes: OpenAPIHono,
  dependencies: ResendVerificationMailRouteDependencies,
): void => {
  routes.openAPIRegistry.registerPath(resendVerificationMailDeclaration)
  routes.on(
    resendVerificationMailDeclaration.method,
    resendVerificationMailDeclaration.path,
    requirePlayer(dependencies),
    async (c) => answerDone(c, await resendVerificationMail(c.var.playerId, dependencies)),
  )
}
