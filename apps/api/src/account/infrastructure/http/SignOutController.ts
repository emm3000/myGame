import { createRoute } from '@hono/zod-openapi'
import type { Sessions } from '@mygame/domain'
import type { Context } from 'hono'
import { signedInDeclaration } from '#platform/infrastructure/http/signedInDeclaration'
import type { SignedInPlayer } from './requirePlayer'
import { clearSessionCookie } from './sessionCookie'

export const signOutDeclaration = createRoute(
  signedInDeclaration({
    method: 'post',
    path: '/auth/sign-out',
    responses: {
      204: { description: 'The session is closed and its cookie cleared.' },
    },
  }),
)

export type SignOutControllerDependencies = {
  readonly sessions: Sessions
  readonly isSessionCookieSecure: boolean
}

export class SignOutController {
  constructor(private readonly dependencies: SignOutControllerDependencies) {}

  async handle(c: Context<SignedInPlayer>): Promise<Response> {
    await this.dependencies.sessions.closeSession(c.var.sessionToken)
    clearSessionCookie(c, this.dependencies.isSessionCookieSecure)
    return c.body(null, 204)
  }
}
