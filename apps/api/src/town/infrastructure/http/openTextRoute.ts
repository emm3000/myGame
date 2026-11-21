import { createRoute, type OpenAPIHono } from '@hono/zod-openapi'
import { type OpenText, OpenTextSchema, ReadTextRequestSchema } from '@mygame/contracts'
import {
  type RequirePlayerDependencies,
  requirePlayer,
} from '#account/infrastructure/http/requirePlayer'
import type { LessonLibrary } from '#content/application/ports/LessonLibrary'
import { honoPathOf } from '#platform/infrastructure/http/honoPath'
import { refusalResponse } from '#platform/infrastructure/http/refusalResponse'
import { respondRefusal } from '#platform/infrastructure/http/respondRefusal'
import { jsonResponse } from '#platform/infrastructure/http/responseDeclarations'
import { signedInRoute } from '#platform/infrastructure/http/signedInDeclaration'
import {
  type ResolveCurrentTownDependencies,
  resolveCurrentTown,
} from '../../application/resolveCurrentTown'
import { presentOpenText } from './presentOpenText'

export const openTextDeclaration = createRoute(
  signedInRoute({
    method: 'get',
    path: '/texts/{textId}',
    request: { params: ReadTextRequestSchema },
    responses: {
      200: jsonResponse(
        'One text the stage has reached, its sentences as spans, each card word with its support at the read.',
        OpenTextSchema,
      ),
      404: refusalResponse(
        'TownNotFound; a text the stage has not reached, or the content lacks, answers an empty body.',
      ),
    },
  }),
)

export type OpenTextRouteDependencies = RequirePlayerDependencies &
  ResolveCurrentTownDependencies & {
    readonly lessons: LessonLibrary
  }

export const openTextRoute = (
  routes: OpenAPIHono,
  dependencies: OpenTextRouteDependencies,
): void => {
  routes.openAPIRegistry.registerPath(openTextDeclaration)
  routes.on(
    openTextDeclaration.method,
    honoPathOf(openTextDeclaration),
    requirePlayer(dependencies),
    async (c) => {
      const request = ReadTextRequestSchema.safeParse(c.req.param())
      if (!request.success) {
        return respondRefusal(c, { kind: 'MalformedRequest' })
      }
      const reading = await resolveCurrentTown(c.var.playerId, dependencies)
      if (!reading.ok) {
        return respondRefusal(c, reading.error)
      }
      const text = presentOpenText(request.data.textId, reading.value, dependencies.lessons)
      if (text === undefined) {
        return c.body(null, 404)
      }
      const body: OpenText = text
      return c.json(body)
    },
  )
}
