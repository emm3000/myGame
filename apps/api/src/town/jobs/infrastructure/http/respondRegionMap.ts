import type { RegionMap } from '@mygame/contracts'
import {
  type CleanUpReader,
  type Clock,
  type ReadRegionMapCommand,
  type RegionMapReader,
  readRegionMap,
  type TownCatalog,
} from '@mygame/domain'
import type { Context } from 'hono'
import { respondRefusal } from '#platform/infrastructure/http/respondRefusal'
import { presentRegionMap } from './presentRegionMap'

export type RespondRegionMapDependencies = {
  readonly regionMap: RegionMapReader
  readonly cleanUps: CleanUpReader
  readonly townCatalog: TownCatalog
  readonly clock: Clock
}

export const respondRegionMap = async (
  c: Context,
  command: ReadRegionMapCommand,
  dependencies: RespondRegionMapDependencies,
): Promise<Response> => {
  const map = await readRegionMap(command, {
    map: dependencies.regionMap,
    cleanUps: dependencies.cleanUps,
    catalog: dependencies.townCatalog,
    clock: dependencies.clock,
  })
  if (!map.ok) {
    return respondRefusal(c, map.error)
  }
  const body: RegionMap = presentRegionMap(map.value)
  return c.json(body)
}
