import { type ProvinceMap, ProvinceMapRequestSchema } from '@mygame/contracts'
import {
  type BuildingCatalog,
  type Clock,
  type KingdomMapReader,
  type ReadProvinceMapCommand,
  readProvinceMap,
} from '@mygame/domain'
import { type Context, Hono } from 'hono'
import { answerRefusal } from '../http/answerRefusal'
import { requireNamedFief } from '../http/requireNamedFief'
import { type RequirePlayerDependencies, requirePlayer } from '../http/requirePlayer'
import type { CampReader } from '../kingdom/CampReader'
import { provinceMapOf } from '../kingdom/provinceMapOf'

export type MapDependencies = RequirePlayerDependencies & {
  readonly map: KingdomMapReader
  readonly buildingCatalog: BuildingCatalog
  readonly camps: CampReader
  readonly clock: Clock
}

export const mapRoutes = (dependencies: MapDependencies): Hono => {
  const answerProvince = async (c: Context, command: ReadProvinceMapCommand): Promise<Response> => {
    const map = await readProvinceMap(command, {
      map: dependencies.map,
      catalog: dependencies.buildingCatalog,
      camps: dependencies.camps,
      clock: dependencies.clock,
    })
    if (!map.ok) {
      return answerRefusal(c, map.error)
    }
    const body: ProvinceMap = provinceMapOf(map.value)
    return c.json(body)
  }
  const signedInPlayer = requirePlayer(dependencies)
  return new Hono()
    .get('/', signedInPlayer, requireNamedFief, async (c) => answerProvince(c, c.var.fiefOfPlayer))
    .get('/:province', signedInPlayer, requireNamedFief, async (c) => {
      const request = ProvinceMapRequestSchema.safeParse(c.req.param())
      if (!request.success) {
        return answerRefusal(c, { kind: 'MalformedRequest' })
      }
      return answerProvince(c, { ...c.var.fiefOfPlayer, province: request.data.province })
    })
}
