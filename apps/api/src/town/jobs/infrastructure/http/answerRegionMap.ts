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
import { answerRefusal } from '#platform/infrastructure/http/answerRefusal'
import { presentRegionMap } from './presentRegionMap'

export type AnswerRegionMapDependencies = {
  readonly regionMap: RegionMapReader
  readonly cleanUps: CleanUpReader
  readonly townCatalog: TownCatalog
  readonly clock: Clock
}

export const answerRegionMap = async (
  c: Context,
  command: ReadRegionMapCommand,
  dependencies: AnswerRegionMapDependencies,
): Promise<Response> => {
  const map = await readRegionMap(command, {
    map: dependencies.regionMap,
    cleanUps: dependencies.cleanUps,
    catalog: dependencies.townCatalog,
    clock: dependencies.clock,
  })
  if (!map.ok) {
    return answerRefusal(c, map.error)
  }
  const body: RegionMap = presentRegionMap(map.value)
  return c.json(body)
}
