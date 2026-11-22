import type { DomainError } from '#DomainError'
import { ok, type Result } from '#Result'
import type { Instant } from '#time/Instant'
import type { Town } from '../../domain/Town'
import type { TownCatalog } from '../../domain/TownCatalog'
import { deriveStorageCapacity } from './deriveStorageCapacity'
import type { FullSince } from './FullSince'
import type { ResourceKind } from './ResourceKind'

export const rebaseFullSince = (
  accrued: FullSince,
  after: Town,
  catalog: TownCatalog,
): Result<Town, DomainError> => {
  const capacity = deriveStorageCapacity(after.buildingLevels.storage, catalog)
  if (!capacity.ok) {
    return capacity
  }
  const fullSinceOf = (resource: ResourceKind): Instant | null =>
    after.stocks[resource] >= capacity.value ? (accrued[resource] ?? after.storedAt) : null
  return ok(
    after.withFullSince({
      money: fullSinceOf('money'),
      food: fullSinceOf('food'),
      power: fullSinceOf('power'),
      material: fullSinceOf('material'),
    }),
  )
}
