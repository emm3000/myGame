import type { DomainError } from '../DomainError'
import type { BuildingCatalog } from '../ports/BuildingCatalog'
import { ok, type Result } from '../Result'
import { materializeResources } from '../resources/materializeResources'
import { Resource, type ResourceKind, type Resources } from '../resources/Resources'
import type { Instant } from '../time/Instant'
import { deriveResourceRates } from './deriveResourceRates'
import { deriveWarehouseCapacity } from './deriveWarehouseCapacity'
import type { Fief, Stocks } from './Fief'

const resourcesOf = (
  stocks: Stocks,
  rates: Readonly<Record<ResourceKind, number>>,
  capacityUnits: number,
): Result<Resources, DomainError> => {
  const wood = Resource.create(stocks.wood, rates.wood, capacityUnits)
  if (!wood.ok) {
    return wood
  }
  const stone = Resource.create(stocks.stone, rates.stone, capacityUnits)
  if (!stone.ok) {
    return stone
  }
  const iron = Resource.create(stocks.iron, rates.iron, capacityUnits)
  if (!iron.ok) {
    return iron
  }
  const gold = Resource.create(stocks.gold, rates.gold, capacityUnits)
  if (!gold.ok) {
    return gold
  }
  const food = Resource.create(stocks.food, rates.food, capacityUnits)
  if (!food.ok) {
    return food
  }
  return ok({
    wood: wood.value,
    stone: stone.value,
    iron: iron.value,
    gold: gold.value,
    food: food.value,
  })
}

export const materializeStocks = (
  fief: Fief,
  catalog: BuildingCatalog,
  now: Instant,
): Result<Stocks, DomainError> => {
  const rates = deriveResourceRates(fief.buildingLevels, fief.terrain, catalog)
  if (!rates.ok) {
    return rates
  }
  const capacityUnits = deriveWarehouseCapacity(fief.buildingLevels.warehouse, catalog)
  if (!capacityUnits.ok) {
    return capacityUnits
  }
  const resources = resourcesOf(fief.stocks, rates.value, capacityUnits.value)
  if (!resources.ok) {
    return resources
  }
  const materialized = materializeResources(resources.value, fief.storedAt, now)
  if (!materialized.ok) {
    return materialized
  }
  const { wood, stone, iron, gold, food } = materialized.value.resources
  return ok({
    wood: wood.amount,
    stone: stone.amount,
    iron: iron.amount,
    gold: gold.amount,
    food: food.amount,
  })
}
