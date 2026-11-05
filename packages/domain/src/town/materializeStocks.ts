import type { DomainError } from '../DomainError'
import { err, ok, type Result } from '../Result'
import { nextSeasonBoundaryAfter } from '../season/nextSeasonBoundaryAfter'
import type { Instant } from '../time/Instant'
import { deriveResourceRates, type ResourceRates } from './deriveResourceRates'
import { deriveStorageCapacity } from './deriveStorageCapacity'
import type { Stocks } from './Stocks'
import type { Town } from './Town'
import type { TownCatalog } from './TownCatalog'

const MILLISECONDS_PER_HOUR = 3_600_000

const accrued = (
  amount: number,
  ratePerHour: number,
  elapsed: number,
  capacity: number,
): number => {
  const grown = Math.floor(
    (amount * MILLISECONDS_PER_HOUR + ratePerHour * elapsed) / MILLISECONDS_PER_HOUR,
  )
  return Math.max(amount, Math.min(capacity, grown))
}

const accrueSegment = (
  stocks: Stocks,
  rates: ResourceRates,
  capacity: number,
  from: Instant,
  to: Instant,
): Stocks => {
  const elapsed = to.epochMilliseconds - from.epochMilliseconds
  return {
    money: accrued(stocks.money, rates.money, elapsed, capacity),
    food: accrued(stocks.food, rates.food, elapsed, capacity),
    power: accrued(stocks.power, rates.power, elapsed, capacity),
    material: accrued(stocks.material, rates.material, elapsed, capacity),
  }
}

export const materializeStocks = (
  town: Town,
  catalog: TownCatalog,
  now: Instant,
): Result<Stocks, DomainError> => {
  if (now.epochMilliseconds < town.storedAt.epochMilliseconds) {
    return err({ kind: 'InstantBeforeStored', storedAt: town.storedAt, now })
  }
  const capacity = deriveStorageCapacity(town.buildingLevels.storage, catalog)
  if (!capacity.ok) {
    return capacity
  }
  let segmentStart = town.storedAt
  let stocks = town.stocks
  while (segmentStart.epochMilliseconds < now.epochMilliseconds) {
    const boundary = nextSeasonBoundaryAfter(segmentStart, catalog.townSettings())
    const segmentEnd = boundary.epochMilliseconds < now.epochMilliseconds ? boundary : now
    const rates = deriveResourceRates(town.buildingLevels, town.terrain, catalog, segmentStart)
    if (!rates.ok) {
      return rates
    }
    stocks = accrueSegment(stocks, rates.value, capacity.value, segmentStart, segmentEnd)
    segmentStart = segmentEnd
  }
  return ok(stocks)
}
