import type { DomainError } from '../DomainError'
import { ok, type Result } from '../Result'
import { nextSeasonBoundaryAfter } from '../season/nextSeasonBoundaryAfter'
import type { Instant } from '../time/Instant'
import { deriveResourceRates } from './deriveResourceRates'
import type { ResourceKind } from './ResourceKind'
import { type Store, storeAfterSegment } from './storeAfterSegment'
import type { Stores } from './storedStoresOf'
import type { Town } from './Town'
import type { TownCatalog } from './TownCatalog'

export type SeasonSegment = {
  readonly stores: Stores
  readonly segmentEnd: Instant
}

const segmentEndOf = (
  segmentStart: Instant,
  to: Instant | undefined,
  catalog: TownCatalog,
): Instant => {
  const boundary = nextSeasonBoundaryAfter(segmentStart, catalog.townSettings())
  return to !== undefined && to.epochMilliseconds < boundary.epochMilliseconds ? to : boundary
}

export const storesAfterSeasonSegment = (
  town: Town,
  catalog: TownCatalog,
  capacity: number,
  stores: Stores,
  segmentStart: Instant,
  to: Instant | undefined,
): Result<SeasonSegment, DomainError> => {
  const segmentEnd = segmentEndOf(segmentStart, to, catalog)
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
  const storeOf = (resource: ResourceKind): Store =>
    storeAfterSegment(stores[resource], rates.value[resource], capacity, segmentStart, segmentEnd)
  return ok({
    stores: {
      money: storeOf('money'),
      food: storeOf('food'),
      power: storeOf('power'),
      material: storeOf('material'),
    },
    segmentEnd,
  })
}
