import { createRoute, type OpenAPIHono } from '@hono/zod-openapi'
import { RegionMapSchema } from '@mygame/contracts'
import {
  type RequirePlayerDependencies,
  requirePlayer,
} from '#account/infrastructure/http/requirePlayer'
import { honoPathOf } from '#platform/infrastructure/http/honoPath'
import { refusalResponse } from '#platform/infrastructure/http/refusalResponse'
import { jsonResponse } from '#platform/infrastructure/http/responseDeclarations'
import { signedInRoute } from '#platform/infrastructure/http/signedInRoute'
import { type RespondRegionMapDependencies, respondRegionMap } from './respondRegionMap'

export const readOwnAreaDeclaration = createRoute(
  signedInRoute({
    method: 'get',
    path: '/',
    responses: {
      200: jsonResponse(
        'The area of the player’s town: each site free or holding a town, the own one marked.',
        RegionMapSchema,
      ),
      404: refusalResponse('TownNotFound: the player holds no town yet.'),
    },
  }),
)

export type ReadOwnAreaRouteDependencies = RequirePlayerDependencies & RespondRegionMapDependencies

export const readOwnAreaRoute = (
  routes: OpenAPIHono,
  dependencies: ReadOwnAreaRouteDependencies,
): void => {
  routes.openAPIRegistry.registerPath(readOwnAreaDeclaration)
  routes.on(
    readOwnAreaDeclaration.method,
    honoPathOf(readOwnAreaDeclaration),
    requirePlayer(dependencies),
    async (c) => respondRegionMap(c, { playerId: c.var.playerId }, dependencies),
  )
}
