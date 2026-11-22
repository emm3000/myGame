import { createRoute, type OpenAPIHono } from '@hono/zod-openapi'
import type { Sessions } from '@mygame/domain'
import { signedInDeclaration } from '#platform/infrastructure/http/signedInDeclaration'
import { type RequirePlayerDependencies, requirePlayer } from './requirePlayer'
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

export type SignOutRouteDependencies = RequirePlayerDependencies & {
  readonly sessions: Sessions
}

export const signOutRoute = (routes: OpenAPIHono, dependencies: SignOutRouteDependencies): void => {
  routes.openAPIRegistry.registerPath(signOutDeclaration)
  routes.on(
    signOutDeclaration.method,
    signOutDeclaration.path,
    requirePlayer(dependencies),
    async (c) => {
      await dependencies.sessions.closeSession(c.var.sessionToken)
      clearSessionCookie(c, dependencies.isSessionCookieSecure)
      return c.body(null, 204)
    },
  )
}
