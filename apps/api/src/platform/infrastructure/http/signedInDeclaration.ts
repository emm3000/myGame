import type { RouteConfig } from '@hono/zod-openapi'
import type { ResponseDeclaration } from './refusalResponse'

export const sessionBearerScheme = 'sessionBearer'

export const sessionBearerSecurityScheme = {
  type: 'http',
  scheme: 'bearer',
  description:
    'The session token the native sign-in answers; read only when the request carries no session cookie.',
} as const

const signedOutResponse: ResponseDeclaration = {
  description:
    'No live session: neither a session cookie nor, without one, an Authorization bearer token names one. Empty body.',
}

export const signedInRoute = <Route extends RouteConfig>(route: Route): Route => ({
  ...route,
  security: [{ [sessionBearerScheme]: [] }],
  responses: { ...route.responses, 401: signedOutResponse },
})
