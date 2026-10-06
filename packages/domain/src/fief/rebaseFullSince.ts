import type { DomainError } from '../DomainError'
import type { BuildingCatalog } from '../ports/BuildingCatalog'
import { ok, type Result } from '../Result'
import type { ResourceKind } from '../resources/Resources'
import type { Instant } from '../time/Instant'
import { deriveFullAt, type FullAt } from './deriveFullAt'
import { deriveWarehouseCapacity } from './deriveWarehouseCapacity'
import type { Fief } from './Fief'

const fullSinceOf = (
  kind: ResourceKind,
  fullAtBefore: FullAt,
  after: Fief,
  capacityUnits: number,
): Instant | null => {
  if (after.stocks[kind] < capacityUnits) {
    return null
  }
  const crossing = fullAtBefore[kind]
  return crossing === null || crossing.epochMilliseconds > after.storedAt.epochMilliseconds
    ? after.storedAt
    : crossing
}

export const rebaseFullSince = (
  before: Fief,
  after: Fief,
  catalog: BuildingCatalog,
): Result<Fief, DomainError> => {
  const fullAtBefore = deriveFullAt(before, catalog)
  if (!fullAtBefore.ok) {
    return fullAtBefore
  }
  const capacityUnits = deriveWarehouseCapacity(after.buildingLevels.warehouse, catalog)
  if (!capacityUnits.ok) {
    return capacityUnits
  }
  const fullSince = (kind: ResourceKind): Instant | null =>
    fullSinceOf(kind, fullAtBefore.value, after, capacityUnits.value)
  return ok(
    after.withFullSince({
      wood: fullSince('wood'),
      stone: fullSince('stone'),
      iron: fullSince('iron'),
      gold: fullSince('gold'),
      food: fullSince('food'),
    }),
  )
}
