import { createRoute, type OpenAPIHono } from '@hono/zod-openapi'
import { RegionMapRequestSchema, RegionMapSchema } from '@mygame/contracts'
import {
  type RequirePlayerDependencies,
  requirePlayer,
} from '#account/infrastructure/http/requirePlayer'
import { answerRefusal } from '#platform/infrastructure/http/answerRefusal'
import { honoPathOf } from '#platform/infrastructure/http/honoPath'
import { refusalResponse } from '#platform/infrastructure/http/refusalResponse'
import { jsonResponse, malformedResponse } from '#platform/infrastructure/http/responseDeclarations'
import { signedInRoute } from '#platform/infrastructure/http/signedInRoute'
import { type AnswerRegionMapDependencies, answerRegionMap } from './answerRegionMap'

export const readAreaDeclaration = createRoute(
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
)

export type ReadAreaRouteDependencies = RequirePlayerDependencies & AnswerRegionMapDependencies

export const readAreaRoute = (
  routes: OpenAPIHono,
  dependencies: ReadAreaRouteDependencies,
): void => {
  routes.openAPIRegistry.registerPath(readAreaDeclaration)
  routes.on(
    readAreaDeclaration.method,
    honoPathOf(readAreaDeclaration),
    requirePlayer(dependencies),
    async (c) => {
      const request = RegionMapRequestSchema.safeParse(c.req.param())
      if (!request.success) {
        return answerRefusal(c, { kind: 'MalformedRequest' })
      }
      return answerRegionMap(c, { playerId: c.var.playerId, area: request.data.area }, dependencies)
    },
  )
}
