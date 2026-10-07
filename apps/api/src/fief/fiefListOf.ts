import type { FiefList } from '@mygame/contracts'
import {
  type BuildingCatalog,
  type DomainError,
  type Fief,
  freeSlotsOf,
  fullStoresOf,
  ok,
  type PlayerId,
  type Result,
} from '@mygame/domain'
import type { CurrentFiefDependencies } from './currentFiefOf'
import { currentFiefsOfPlayer } from './currentFiefsOfPlayer'

type FiefListEntry = FiefList['fiefs'][number]

const entryOf = (fief: Fief, catalog: BuildingCatalog): Result<FiefListEntry, DomainError> => {
  const fullStores = fullStoresOf(fief, catalog)
  if (!fullStores.ok) {
    return fullStores
  }
  const { kingdom, province, plot } = fief.coordinates
  return ok({
    id: fief.id,
    name: fief.name.value,
    coordinates: { kingdom, province, plot },
    freeSlots: [...freeSlotsOf(fief)],
    fullStores: [...fullStores.value],
  })
}

export const fiefListOf = async (
  playerId: PlayerId,
  dependencies: CurrentFiefDependencies,
): Promise<Result<FiefList, DomainError>> => {
  const readings = await currentFiefsOfPlayer(playerId, dependencies)
  if (!readings.ok) {
    return readings
  }
  const entries: Array<FiefListEntry> = []
  for (const { fief } of readings.value) {
    const entry = entryOf(fief, dependencies.buildingCatalog)
    if (!entry.ok) {
      return entry
    }
    entries.push(entry.value)
  }
  return ok({ fiefs: entries })
}
