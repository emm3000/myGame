import type { DomainError } from '../DomainError'
import { ok, type Result } from '../Result'
import { SEASONS_PER_YEAR } from '../season/seasonAt'
import { deriveStorageCapacity } from './deriveStorageCapacity'
import type { FullSince } from './FullSince'
import type { ResourceKind } from './ResourceKind'
import { resourceKinds } from './resourceKinds'
import { fullSinceOf, type Stores } from './Stores'
import { storedStoresOf } from './storedStoresOf'
import { storesAfterSeasonSegment } from './storesAfterSeasonSegment'
import type { Town } from './Town'
import type { TownCatalog } from './TownCatalog'

export type FullAt = FullSince

type UnchangedSegments = Readonly<Record<ResourceKind, number>>

const SEGMENTS_PROVING_NO_FILL = SEASONS_PER_YEAR + 1

const isSettled = (unchanged: UnchangedSegments, resource: ResourceKind): boolean =>
  unchanged[resource] >= SEGMENTS_PROVING_NO_FILL

const unchangedAfter = (
  unchanged: UnchangedSegments,
  before: Stores,
  after: Stores,
): UnchangedSegments => {
  const countOf = (resource: ResourceKind): number =>
    after[resource].amount === before[resource].amount ? unchanged[resource] + 1 : 0
  return {
    money: countOf('money'),
    food: countOf('food'),
    power: countOf('power'),
    material: countOf('material'),
  }
}

export const deriveFullAt = (town: Town, catalog: TownCatalog): Result<FullAt, DomainError> => {
  const capacity = deriveStorageCapacity(town.buildingLevels.storage, catalog)
  if (!capacity.ok) {
    return capacity
  }
  let segmentStart = town.storedAt
  let stores = storedStoresOf(town, capacity.value)
  let unchanged: UnchangedSegments = { money: 0, food: 0, power: 0, material: 0 }
  while (!resourceKinds.every((resource) => isSettled(unchanged, resource))) {
    const segment = storesAfterSeasonSegment(
      town,
      catalog,
      capacity.value,
      stores,
      segmentStart,
      undefined,
    )
    if (!segment.ok) {
      return segment
    }
    unchanged = unchangedAfter(unchanged, stores, segment.value.stores)
    stores = segment.value.stores
    segmentStart = segment.value.segmentEnd
  }
  return ok(fullSinceOf(stores))
}
