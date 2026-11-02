import type { RouteConfig } from '@hono/zod-openapi'
import type { ZodType } from 'zod'
import type { ResponseDeclaration } from './refusalResponse'

export type BodyDeclaration = NonNullable<NonNullable<RouteConfig['request']>['body']>

export const jsonBody = (schema: ZodType): BodyDeclaration => ({
  required: true,
  content: { 'application/json': { schema } },
})

export const jsonResponse = (description: string, schema: ZodType): ResponseDeclaration => ({
  description,
  content: { 'application/json': { schema } },
})

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
