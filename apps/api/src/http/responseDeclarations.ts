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

export const signedOutResponse: ResponseDeclaration = {
  description: 'No live session cookie. Empty body.',
}

export const honoPathOf = ({ path }: { readonly path: string }): string =>
  path.replace(/\{(\w+)\}/g, ':$1')
