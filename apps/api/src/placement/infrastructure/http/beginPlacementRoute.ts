import { createRoute, type OpenAPIHono } from '@hono/zod-openapi'
import { beginPlacement, type RandomSource, readPlacement } from '@mygame/domain'
import { readScaffold } from '#account/application/readScaffold'
import {
  type RequirePlayerDependencies,
  requirePlayer,
} from '#account/infrastructure/http/requirePlayer'
import type { LearningDependencies } from '#learning/application/LearningDependencies'
import { honoPathOf } from '#platform/infrastructure/http/honoPath'
import { signedInRoute } from '#platform/infrastructure/http/signedInRoute'
import { mutateTown } from '#town/application/mutateTown'
import { offerRefused, placementResponse } from './placementComponents'
import { respondPlacementView } from './respondPlacementView'

export const beginPlacementDeclaration = createRoute(
  signedInRoute({
    method: 'post',
    path: '/',
    responses: {
      200: placementResponse(
        'The placement begun: the api drew each band’s sample and asks band 1.',
      ),
      409: offerRefused,
    },
  }),
)

export type BeginPlacementRouteDependencies = LearningDependencies &
  RequirePlayerDependencies & {
    readonly random: RandomSource
  }

export const beginPlacementRoute = (
  routes: OpenAPIHono,
  dependencies: BeginPlacementRouteDependencies,
): void => {
  const { lessons, random } = dependencies
  routes.openAPIRegistry.registerPath(beginPlacementDeclaration)
  routes.on(
    beginPlacementDeclaration.method,
    honoPathOf(beginPlacementDeclaration),
    requirePlayer(dependencies),
    async (c) => {
      const playerId = c.var.playerId
      const view = await mutateTown(
        playerId,
        async (stores, clock) => {
          const begun = await beginPlacement(
            { playerId },
            {
              placements: stores.placements,
              bandStarts: stores.bandStarts,
              words: lessons,
              bands: lessons,
              random,
              clock,
            },
          )
          const scaffold = await readScaffold(playerId, stores.accounts)
          return begun.ok
            ? readPlacement(
                { playerId, scaffold },
                {
                  placements: stores.placements,
                  bandStarts: stores.bandStarts,
                  words: lessons,
                  bands: lessons,
                },
              )
            : begun
        },
        dependencies,
      )
      return respondPlacementView(c, view)
    },
  )
}
