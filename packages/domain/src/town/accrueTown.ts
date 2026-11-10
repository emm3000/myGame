import type { DomainError } from '../DomainError'
import { err, ok, type Result } from '../Result'
import { nextSeasonBoundaryAfter } from '../season/nextSeasonBoundaryAfter'
import type { Instant } from '../time/Instant'
import { deriveResourceRates, type ResourceRates } from './deriveResourceRates'
import { deriveStorageCapacity } from './deriveStorageCapacity'
import type { FullSince } from './FullSince'
import type { ResourceKind } from './ResourceKind'
import { resourceKinds } from './resourceKinds'
import type { Stocks } from './Stocks'
import { type Store, storeAfterSegment } from './storeAfterSegment'
import type { Town } from './Town'
import type { TownCatalog } from './TownCatalog'

export type Accrual = {
  readonly stocks: Stocks
  readonly fullSince: FullSince
}

type Stores = Readonly<Record<ResourceKind, Store>>

const storedStoresOf = (town: Town, capacity: number): Stores => {
  const storeOf = (resource: ResourceKind): Store => ({
    amount: town.stocks[resource],
    fullSince:
      town.stocks[resource] >= capacity ? (town.fullSince[resource] ?? town.storedAt) : null,
  })
  return {
    money: storeOf('money'),
    food: storeOf('food'),
    power: storeOf('power'),
    material: storeOf('material'),
  }
}

const storesAfterSegment = (
  stores: Stores,
  rates: ResourceRates,
  capacity: number,
  from: Instant,
  to: Instant,
): Stores => {
  const storeOf = (resource: ResourceKind): Store =>
    storeAfterSegment(stores[resource], rates[resource], capacity, from, to)
  return {
    money: storeOf('money'),
    food: storeOf('food'),
    power: storeOf('power'),
    material: storeOf('material'),
  }
}

const accrualOf = (stores: Stores): Accrual => {
  const stocks: Record<ResourceKind, number> = { money: 0, food: 0, power: 0, material: 0 }
  const fullSince: Record<ResourceKind, Instant | null> = {
    money: null,
    food: null,
    power: null,
    material: null,
  }
  for (const resource of resourceKinds) {
    stocks[resource] = stores[resource].amount
    fullSince[resource] = stores[resource].fullSince
  }
  return { stocks, fullSince }
}

export const accrueTown = (
  town: Town,
  catalog: TownCatalog,
  to: Instant,
): Result<Accrual, DomainError> => {
  if (to.epochMilliseconds < town.storedAt.epochMilliseconds) {
    return err({ kind: 'InstantBeforeStored', storedAt: town.storedAt, now: to })
  }
  const capacity = deriveStorageCapacity(town.buildingLevels.storage, catalog)
  if (!capacity.ok) {
    return capacity
  }
  let segmentStart = town.storedAt
  let stores = storedStoresOf(town, capacity.value)
  while (segmentStart.epochMilliseconds < to.epochMilliseconds) {
    const boundary = nextSeasonBoundaryAfter(segmentStart, catalog.townSettings())
    const segmentEnd = boundary.epochMilliseconds < to.epochMilliseconds ? boundary : to
    const rates = deriveResourceRates(
      town.buildingLevels,
      town.terrain,
      town.skills,
      catalog,
      segmentStart,
    )
    if (!rates.ok) {
      return rates
    }
    stores = storesAfterSegment(stores, rates.value, capacity.value, segmentStart, segmentEnd)
    segmentStart = segmentEnd
  }
  return ok(accrualOf(stores))
}
