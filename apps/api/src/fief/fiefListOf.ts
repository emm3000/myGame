import { type FiefList, ResourceKindSchema } from '@mygame/contracts'
import {
  type BuildingCatalog,
  type DomainError,
  deriveWarehouseCapacity,
  type Fief,
  type FiefId,
  ok,
  type PlayerId,
  type Result,
} from '@mygame/domain'
import { type CurrentFiefDependencies, currentFiefOf } from './currentFiefOf'

type FiefListEntry = FiefList['fiefs'][number]

const freeSlotsOf = (fief: Fief): FiefListEntry['freeSlots'] => {
  const hasLibrary = fief.buildingLevels.library >= 1
  const hasBarracks = fief.buildingLevels.barracks >= 1
  const slots: ReadonlyArray<[FiefListEntry['freeSlots'][number], boolean]> = [
    ['build', fief.slot.kind === 'idle'],
    ['study', hasLibrary && fief.studySlot.kind === 'idle'],
    ['recruit', hasBarracks && fief.recruitOrder.kind === 'idle'],
    ['march', hasBarracks && fief.march.kind === 'idle'],
  ]
  return slots.filter(([, isFree]) => isFree).map(([slot]) => slot)
}

const fullStoresOf = (fief: Fief, capacityUnits: number): FiefListEntry['fullStores'] =>
  ResourceKindSchema.options.filter((kind) => fief.stocks[kind] >= capacityUnits)

const entryOf = (fief: Fief, catalog: BuildingCatalog): Result<FiefListEntry, DomainError> => {
  const capacityUnits = deriveWarehouseCapacity(fief.buildingLevels.warehouse, catalog)
  if (!capacityUnits.ok) {
    return capacityUnits
  }
  const { kingdom, province, plot } = fief.coordinates
  return ok({
    id: fief.id,
    name: fief.name.value,
    coordinates: { kingdom, province, plot },
    freeSlots: freeSlotsOf(fief),
    fullStores: fullStoresOf(fief, capacityUnits.value),
  })
}

const currentFiefsOf = async (
  playerId: PlayerId,
  fiefIds: ReadonlyArray<FiefId>,
  dependencies: CurrentFiefDependencies,
): Promise<Result<ReadonlyArray<Fief>, DomainError>> => {
  const fiefs = await Promise.all(
    fiefIds.map((fiefId) => currentFiefOf({ playerId, fiefId }, dependencies)),
  )
  const current: Array<Fief> = []
  for (const fief of fiefs) {
    if (!fief.ok) {
      return fief
    }
    current.push(fief.value)
  }
  return ok(current)
}

export const fiefListOf = async (
  playerId: PlayerId,
  dependencies: CurrentFiefDependencies,
): Promise<Result<FiefList, DomainError>> => {
  const listed = await currentFiefsOf(
    playerId,
    await dependencies.fiefs.fiefsOf(playerId),
    dependencies,
  )
  if (!listed.ok) {
    return listed
  }
  const fiefIds = await dependencies.fiefs.fiefsOf(playerId)
  const founded = await currentFiefsOf(
    playerId,
    fiefIds.filter((fiefId) => !listed.value.some(({ id }) => id === fiefId)),
    dependencies,
  )
  if (!founded.ok) {
    return founded
  }
  const current = new Map([...listed.value, ...founded.value].map((fief) => [fief.id, fief]))
  const entries: Array<FiefListEntry> = []
  for (const fief of fiefIds.flatMap((fiefId) => current.get(fiefId) ?? [])) {
    const entry = entryOf(fief, dependencies.buildingCatalog)
    if (!entry.ok) {
      return entry
    }
    entries.push(entry.value)
  }
  return ok({ fiefs: entries })
}
