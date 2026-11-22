import { createRoute } from '@hono/zod-openapi'
import { type RegionMap, RegionMapSchema } from '@mygame/contracts'
import type { ReadRegionMap } from '@mygame/domain'
import type { Context } from 'hono'
import type { SignedInPlayer } from '#account/infrastructure/http/requirePlayer'
import { refusalResponse } from '#platform/infrastructure/http/refusalResponse'
import { respondRefusal } from '#platform/infrastructure/http/respondRefusal'
import { jsonResponse } from '#platform/infrastructure/http/responseDeclarations'
import { signedInDeclaration } from '#platform/infrastructure/http/signedInDeclaration'
import { presentRegionMap } from './presentRegionMap'

export const readOwnAreaDeclaration = createRoute(
  signedInDeclaration({
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

export type ReadOwnAreaControllerDependencies = {
  readonly readRegionMap: ReadRegionMap
}

export class ReadOwnAreaController {
  constructor(private readonly dependencies: ReadOwnAreaControllerDependencies) {}

  async handle(c: Context<SignedInPlayer>): Promise<Response> {
    const map = await this.dependencies.readRegionMap.execute({ playerId: c.var.playerId })
    if (!map.ok) {
      return respondRefusal(c, map.error)
    }
    const body: RegionMap = presentRegionMap(map.value)
    return c.json(body)
  }
}
