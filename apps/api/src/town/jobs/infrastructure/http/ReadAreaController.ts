import { createRoute } from '@hono/zod-openapi'
import { type RegionMap, RegionMapRequestSchema, RegionMapSchema } from '@mygame/contracts'
import type { ReadRegionMap } from '@mygame/domain'
import type { Context } from 'hono'
import type { SignedInPlayer } from '#account/infrastructure/http/requirePlayer'
import { refusalResponse } from '#platform/infrastructure/http/refusalResponse'
import { respondRefusal } from '#platform/infrastructure/http/respondRefusal'
import { jsonResponse, malformedResponse } from '#platform/infrastructure/http/responseDeclarations'
import { signedInDeclaration } from '#platform/infrastructure/http/signedInDeclaration'
import { presentRegionMap } from './presentRegionMap'

export const readAreaDeclaration = createRoute(
  signedInDeclaration({
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

export type ReadAreaControllerDependencies = {
  readonly readRegionMap: ReadRegionMap
}

export class ReadAreaController {
  constructor(private readonly dependencies: ReadAreaControllerDependencies) {}

  async handle(c: Context<SignedInPlayer>): Promise<Response> {
    const request = RegionMapRequestSchema.safeParse(c.req.param())
    if (!request.success) {
      return respondRefusal(c, { kind: 'MalformedRequest' })
    }
    const map = await this.dependencies.readRegionMap.execute({
      playerId: c.var.playerId,
      area: request.data.area,
    })
    if (!map.ok) {
      return respondRefusal(c, map.error)
    }
    const body: RegionMap = presentRegionMap(map.value)
    return c.json(body)
  }
}
