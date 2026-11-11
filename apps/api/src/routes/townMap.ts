import { OpenAPIHono } from '@hono/zod-openapi'
import { type RegionMap, RegionMapRequestSchema } from '@mygame/contracts'
import {
  type ReadRegionMapCommand,
  type RegionMapReader,
  readRegionMap,
  type TownCatalog,
} from '@mygame/domain'
import type { Context } from 'hono'
import { answerRefusal } from '../http/answerRefusal'
import { honoPathOf } from '../http/honoPath'
import { type RequirePlayerDependencies, requirePlayer } from '../http/requirePlayer'
import { regionMapOf } from '../town/regionMapOf'
import { townMapDeclarations } from './townMapDeclarations'

export type TownMapDependencies = RequirePlayerDependencies & {
  readonly regionMap: RegionMapReader
  readonly townCatalog: TownCatalog
}

export const townMapRoutes = (dependencies: TownMapDependencies): OpenAPIHono => {
  const answerArea = async (c: Context, command: ReadRegionMapCommand): Promise<Response> => {
    const map = await readRegionMap(command, {
      map: dependencies.regionMap,
      catalog: dependencies.townCatalog,
    })
    if (!map.ok) {
      return answerRefusal(c, map.error)
    }
    const body: RegionMap = regionMapOf(map.value)
    return c.json(body)
  }
  const signedInPlayer = requirePlayer(dependencies)
  const routes = new OpenAPIHono()
  for (const declaration of Object.values(townMapDeclarations)) {
    routes.openAPIRegistry.registerPath(declaration)
  }
  routes.on(
    townMapDeclarations.ownArea.method,
    honoPathOf(townMapDeclarations.ownArea),
    signedInPlayer,
    async (c) => answerArea(c, { playerId: c.var.playerId }),
  )
  routes.on(
    townMapDeclarations.area.method,
    honoPathOf(townMapDeclarations.area),
    signedInPlayer,
    async (c) => {
      const request = RegionMapRequestSchema.safeParse(c.req.param())
      if (!request.success) {
        return answerRefusal(c, { kind: 'MalformedRequest' })
      }
      return answerArea(c, { playerId: c.var.playerId, area: request.data.area })
    },
  )
  return routes
}
