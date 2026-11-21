import type { RouteConfig } from '@hono/zod-openapi'
import { ApiErrorSchema } from '@mygame/contracts'

export type ResponseDeclaration = RouteConfig['responses'][string]

export const refusalResponse = (description: string): ResponseDeclaration => ({
  description,
  content: { 'application/json': { schema: ApiErrorSchema } },
})
