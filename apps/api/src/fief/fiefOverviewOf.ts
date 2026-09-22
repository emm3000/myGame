import { BuildingKindSchema, type FiefOverview } from '@mygame/contracts'
import {
  type BuildingCatalog,
  type BuildingKind,
  type BuildSlot,
  type DomainError,
  deriveFreePeasants,
  deriveOccupiedPeasants,
  derivePeasantsForUpgrade,
  deriveResourceRates,
  deriveSuppliedPeasants,
  deriveWarehouseCapacity,
  type Fief,
  type FiefBuildingLevels,
  type Instant,
  ok,
  type ResourceKind,
  type Result,
  type Stocks,
} from '@mygame/domain'

const isoOf = (instant: Instant): string => new Date(instant.epochMilliseconds).toISOString()

const slotOf = (slot: BuildSlot): FiefOverview['slot'] =>
  slot.kind === 'idle'
    ? { kind: 'idle' }
    : {
        kind: 'busy',
        building: slot.building,
        targetLevel: slot.targetLevel,
        finishesAt: isoOf(slot.finishesAt),
      }

const resourcesOf = (
  stocks: Stocks,
  rates: Readonly<Record<ResourceKind, number>>,
  capacity: number,
): FiefOverview['resources'] => ({
  wood: { amount: stocks.wood, ratePerHour: rates.wood, capacity },
  stone: { amount: stocks.stone, ratePerHour: rates.stone, capacity },
  iron: { amount: stocks.iron, ratePerHour: rates.iron, capacity },
  gold: { amount: stocks.gold, ratePerHour: rates.gold, capacity },
  food: { amount: stocks.food, ratePerHour: rates.food, capacity },
})

const peasantsOf = (
  buildingLevels: FiefBuildingLevels,
  catalog: BuildingCatalog,
): Result<FiefOverview['peasants'], DomainError> => {
  const supplied = deriveSuppliedPeasants(buildingLevels.farm, catalog)
  if (!supplied.ok) {
    return supplied
  }
  const occupied = deriveOccupiedPeasants(buildingLevels, catalog)
  if (!occupied.ok) {
    return occupied
  }
  const free = deriveFreePeasants(supplied.value, occupied.value)
  if (!free.ok) {
    return free
  }
  return ok({ supplied: supplied.value, occupied: occupied.value, free: free.value })
}

type BuildingState = FiefOverview['buildings'][BuildingKind]

const nextLevelOf = (
  building: BuildingKind,
  buildingLevels: FiefBuildingLevels,
  catalog: BuildingCatalog,
): Result<BuildingState['nextLevel'], DomainError> => {
  const next = catalog.levelOf(building, buildingLevels[building] + 1)
  if (next === undefined) {
    return ok(null)
  }
  const peasants = derivePeasantsForUpgrade(buildingLevels, building, next.level, catalog)
  if (!peasants.ok) {
    return peasants
  }
  const { level, cost, durationSeconds } = next
  return ok({ level, cost: { ...cost }, durationSeconds, peasants: peasants.value })
}

const buildingsOf = (
  buildingLevels: FiefBuildingLevels,
  catalog: BuildingCatalog,
): Result<FiefOverview['buildings'], DomainError> => {
  const buildings: Record<BuildingKind, BuildingState> = {
    sawmill: { level: buildingLevels.sawmill, nextLevel: null },
    quarry: { level: buildingLevels.quarry, nextLevel: null },
    ironMine: { level: buildingLevels.ironMine, nextLevel: null },
    farm: { level: buildingLevels.farm, nextLevel: null },
    warehouse: { level: buildingLevels.warehouse, nextLevel: null },
  }
  for (const building of BuildingKindSchema.options) {
    const nextLevel = nextLevelOf(building, buildingLevels, catalog)
    if (!nextLevel.ok) {
      return nextLevel
    }
    buildings[building] = { ...buildings[building], nextLevel: nextLevel.value }
  }
  return ok(buildings)
}

export const fiefOverviewOf = (
  fief: Fief,
  catalog: BuildingCatalog,
): Result<FiefOverview, DomainError> => {
  const rates = deriveResourceRates(fief.buildingLevels, fief.terrain, catalog)
  if (!rates.ok) {
    return rates
  }
  const capacity = deriveWarehouseCapacity(fief.buildingLevels.warehouse, catalog)
  if (!capacity.ok) {
    return capacity
  }
  const peasants = peasantsOf(fief.buildingLevels, catalog)
  if (!peasants.ok) {
    return peasants
  }
  const buildings = buildingsOf(fief.buildingLevels, catalog)
  if (!buildings.ok) {
    return buildings
  }
  const { kingdom, province, plot } = fief.coordinates
  return ok({
    name: fief.name.value,
    coordinates: { kingdom, province, plot },
    terrain: fief.terrain,
    resources: resourcesOf(fief.stocks, rates.value, capacity.value),
    buildings: buildings.value,
    peasants: peasants.value,
    slot: slotOf(fief.slot),
    readAt: isoOf(fief.storedAt),
  })
}
