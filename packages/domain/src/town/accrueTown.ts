import type { DomainError } from '../DomainError'
import { err, ok, type Result } from '../Result'
import type { Instant } from '../time/Instant'
import { deriveStorageCapacity } from './deriveStorageCapacity'
import type { FullSince } from './FullSince'
import type { Stocks } from './Stocks'
import { fullSinceOf, type Stores } from './Stores'
import { storedStoresOf } from './storedStoresOf'
import { storesAfterSeasonSegment } from './storesAfterSeasonSegment'
import type { Town } from './Town'
import type { TownCatalog } from './TownCatalog'

export type Accrual = {
  readonly stocks: Stocks
  readonly fullSince: FullSince
}

const accrualOf = (stores: Stores): Accrual => ({
  stocks: {
    money: stores.money.amount,
    food: stores.food.amount,
    power: stores.power.amount,
    material: stores.material.amount,
  },
  fullSince: fullSinceOf(stores),
})

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
    const segment = storesAfterSeasonSegment(
      town,
      catalog,
      capacity.value,
      stores,
      segmentStart,
      to,
    )
    if (!segment.ok) {
      return segment
    }
    stores = segment.value.stores
    segmentStart = segment.value.segmentEnd
  }
  return ok(accrualOf(stores))
}
