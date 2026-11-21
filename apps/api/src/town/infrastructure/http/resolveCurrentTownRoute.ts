import { createRoute, type OpenAPIHono } from '@hono/zod-openapi'
import {
  type RequirePlayerDependencies,
  requirePlayer,
} from '#account/infrastructure/http/requirePlayer'
import { honoPathOf } from '#platform/infrastructure/http/honoPath'
import { signedInRoute } from '#platform/infrastructure/http/signedInRoute'
import {
  type ResolveCurrentTownDependencies,
  resolveCurrentTown,
} from '../../application/resolveCurrentTown'
import { type AnswerTownReadingDependencies, answerTownReading } from './respondTownReading'
import { overviewResponse, townNotFoundResponse } from './townComponents'

export const resolveCurrentTownDeclaration = createRoute(
  signedInRoute({
    method: 'get',
    path: '/',
    responses: {
      200: overviewResponse(
        'The player’s town, accrued to the read, with every finished work applied.',
      ),
      404: townNotFoundResponse,
    },
  }),
)

export type ResolveCurrentTownRouteDependencies = RequirePlayerDependencies &
  ResolveCurrentTownDependencies &
  AnswerTownReadingDependencies

export const resolveCurrentTownRoute = (
  routes: OpenAPIHono,
  dependencies: ResolveCurrentTownRouteDependencies,
): void => {
  routes.openAPIRegistry.registerPath(resolveCurrentTownDeclaration)
  routes.on(
    resolveCurrentTownDeclaration.method,
    honoPathOf(resolveCurrentTownDeclaration),
    requirePlayer(dependencies),
    async (c) =>
      answerTownReading(c, await resolveCurrentTown(c.var.playerId, dependencies), dependencies),
  )
}
