import { createRoute, type OpenAPIHono } from '@hono/zod-openapi'
import { readPlacement, skipPlacement } from '@mygame/domain'
import { readScaffold } from '../../../account/application/readScaffold'
import {
  type RequirePlayerDependencies,
  requirePlayer,
} from '../../../account/infrastructure/http/requirePlayer'
import type { LearningDependencies } from '../../../learning/LearningDependencies'
import { honoPathOf } from '../../../platform/infrastructure/http/honoPath'
import { signedInRoute } from '../../../platform/infrastructure/http/signedInRoute'
import { mutateTown } from '../../../town/mutateTown'
import { answerPlacementView } from './answerPlacementView'
import { offerRefused, placementResponse } from './placementComponents'

export const skipPlacementDeclaration = createRoute(
  signedInRoute({
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
  const content = { words: lessons, bands: lessons }
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
          const skipped = await skipPlacement({ playerId }, { ...stores, ...content, clock })
          const scaffold = await readScaffold(playerId, stores.accounts)
          return skipped.ok
            ? readPlacement({ playerId, scaffold }, { ...stores, ...content })
            : skipped
        },
        dependencies,
      )
      return answerPlacementView(c, view)
    },
  )
}
