import { createRoute } from '@hono/zod-openapi'
import { RegionMapRequestSchema, RegionMapSchema } from '@mygame/contracts'
import { refusalResponse } from '../http/refusalResponse'
import { jsonResponse, signedInRoute } from '../http/responseDeclarations'
import { malformedResponse } from './townDeclarations'

export const townMapDeclarations = {
  ownArea: createRoute(
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
  ),
  area: createRoute(
    signedInRoute({
      method: 'get',
      path: '/{area}',
      request: { params: RegionMapRequestSchema },
      responses: {
        200: jsonResponse(
          'The area the path names in the town’s region, from 1 to one past the last area holding a town.',
          RegionMapSchema,
        ),
        400: malformedResponse('path'),
        404: refusalResponse('TownNotFound, or AreaNotFound for an area past the last browsable.'),
      },
    }),
  ),
}
