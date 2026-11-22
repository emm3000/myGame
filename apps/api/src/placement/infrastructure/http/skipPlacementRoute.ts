import { createRoute, type OpenAPIHono } from '@hono/zod-openapi'
import { readPlacement, readScaffold, skipPlacement } from '@mygame/domain'
import {
  type RequirePlayerDependencies,
  requirePlayer,
} from '#account/infrastructure/http/requirePlayer'
import type { LearningDependencies } from '#learning/application/LearningDependencies'
import { honoPathOf } from '#platform/infrastructure/http/honoPath'
import { signedInDeclaration } from '#platform/infrastructure/http/signedInDeclaration'
import { mutateTown } from '#town/application/mutateTown'
import { offerRefused, placementResponse } from './placementComponents'
import { respondPlacementView } from './respondPlacementView'

export const skipPlacementDeclaration = createRoute(
  signedInDeclaration({
    method: 'post',
    path: '/skip',
    responses: {
      200: placementResponse('The placement skipped for good; the player starts at lesson 1.'),
      409: offerRefused,
    },
  }),
)

export type SkipPlacementRouteDependencies = LearningDependencies & RequirePlayerDependencies

export const skipPlacementRoute = (
  routes: OpenAPIHono,
  dependencies: SkipPlacementRouteDependencies,
): void => {
  const { lessons } = dependencies
  routes.openAPIRegistry.registerPath(skipPlacementDeclaration)
  routes.on(
    skipPlacementDeclaration.method,
    honoPathOf(skipPlacementDeclaration),
    requirePlayer(dependencies),
    async (c) => {
      const playerId = c.var.playerId
      const view = await mutateTown(
        playerId,
        async (stores, clock) => {
          const skipped = await skipPlacement(
            { playerId },
            {
              placements: stores.placements,
              bandStarts: stores.bandStarts,
              words: lessons,
              bands: lessons,
              clock,
            },
          )
          const scaffold = await readScaffold(playerId, stores.accounts)
          return skipped.ok
            ? readPlacement(
                { playerId, scaffold },
                {
                  placements: stores.placements,
                  bandStarts: stores.bandStarts,
                  words: lessons,
                  bands: lessons,
                },
              )
            : skipped
        },
        dependencies,
      )
      return respondPlacementView(c, view)
    },
  )
}
