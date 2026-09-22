import type { FiefOverview } from '@mygame/contracts'
import {
  type BuildingCatalog,
  type BuildingKind,
  type BuildSlot,
  type DomainError,
  deriveFreePeasants,
  deriveOccupiedPeasants,
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

const buildingStateOf = (
  building: BuildingKind,
  buildingLevels: FiefBuildingLevels,
  occupied: number,
  catalog: BuildingCatalog,
): Result<BuildingState, DomainError> => {
  const level = buildingLevels[building]
  const next = catalog.levelOf(building, level + 1)
  if (next === undefined) {
    return ok({ level, nextLevel: null })
  }
  const occupiedAfter = deriveOccupiedPeasants(
    { ...buildingLevels, [building]: next.level },
    catalog,
  )
  if (!occupiedAfter.ok) {
    return occupiedAfter
  }
  const { cost, durationSeconds } = next
  const peasants = occupiedAfter.value - occupied
  return ok({
    level,
    nextLevel: { level: next.level, cost: { ...cost }, durationSeconds, peasants },
  })
}

const buildingsOf = (
  buildingLevels: FiefBuildingLevels,
  occupied: number,
  catalog: BuildingCatalog,
): Result<FiefOverview['buildings'], DomainError> => {
  const stateOf = (building: BuildingKind): Result<BuildingState, DomainError> =>
    buildingStateOf(building, buildingLevels, occupied, catalog)
  const sawmill = stateOf('sawmill')
  if (!sawmill.ok) {
    return sawmill
  }
  const quarry = stateOf('quarry')
  if (!quarry.ok) {
    return quarry
  }
  const ironMine = stateOf('ironMine')
  if (!ironMine.ok) {
    return ironMine
  }
  const farm = stateOf('farm')
  if (!farm.ok) {
    return farm
  }
  const warehouse = stateOf('warehouse')
  if (!warehouse.ok) {
    return warehouse
  }
  return ok({
    sawmill: sawmill.value,
    quarry: quarry.value,
    ironMine: ironMine.value,
    farm: farm.value,
    warehouse: warehouse.value,
  })
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
  const buildings = buildingsOf(fief.buildingLevels, peasants.value.occupied, catalog)
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
