import { createRoute, type OpenAPIHono } from '@hono/zod-openapi'
import { readPlacement } from '@mygame/domain'
import { readScaffold } from '#account/application/readScaffold'
import {
  type RequirePlayerDependencies,
  requirePlayer,
} from '#account/infrastructure/http/requirePlayer'
import type { LearningDependencies } from '#learning/application/LearningDependencies'
import { honoPathOf } from '#platform/infrastructure/http/honoPath'
import { signedInRoute } from '#platform/infrastructure/http/signedInRoute'
import { mutateTown } from '#town/application/mutateTown'
import { answerPlacementView } from './answerPlacementView'
import { placementResponse } from './placementComponents'

export const readPlacementDeclaration = createRoute(
  signedInRoute({
    method: 'get',
    path: '/',
    responses: {
      200: placementResponse(
        'The placement offered, the band it asks with its words and choices, or the stored scores once it is closed.',
      ),
    },
  }),
)

export type ReadPlacementRouteDependencies = LearningDependencies & RequirePlayerDependencies

export const readPlacementRoute = (
  routes: OpenAPIHono,
  dependencies: ReadPlacementRouteDependencies,
): void => {
  const { lessons } = dependencies
  routes.openAPIRegistry.registerPath(readPlacementDeclaration)
  routes.on(
    readPlacementDeclaration.method,
    honoPathOf(readPlacementDeclaration),
    requirePlayer(dependencies),
    async (c) => {
      const playerId = c.var.playerId
      const view = await mutateTown(
        playerId,
        async (stores) =>
          readPlacement(
            { playerId, scaffold: await readScaffold(playerId, stores.accounts) },
            {
              placements: stores.placements,
              bandStarts: stores.bandStarts,
              words: lessons,
              bands: lessons,
            },
          ),
        dependencies,
      )
      return answerPlacementView(c, view)
    },
  )
}
