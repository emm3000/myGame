import type { RouteConfig } from '@hono/zod-openapi'
import type { ZodType } from 'zod'
import type { ResponseDeclaration } from './refusalResponse'

export type BodyDeclaration = NonNullable<NonNullable<RouteConfig['request']>['body']>

export const jsonBody = (schema: ZodType): BodyDeclaration => ({
  required: true,
  content: { 'application/json': { schema } },
})

export const malformedResponse = (what: string): ResponseDeclaration => ({
  description: `A malformed ${what}. Empty body.`,
})

export const jsonResponse = (description: string, schema: ZodType): ResponseDeclaration => ({
  description,
  content: { 'application/json': { schema } },
})
