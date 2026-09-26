import type { DomainError } from '../DomainError'
import type { BuildingCatalog } from '../ports/BuildingCatalog'
import { ok, type Result } from '../Result'
import type { BuildQueueEntry } from './BuildQueue'
import { deriveOccupiedPeasants } from './deriveOccupiedPeasants'
import { derivePeasantsForUpgrade } from './derivePeasantsForUpgrade'
import { deriveSuppliedPeasants } from './deriveSuppliedPeasants'
import type { FiefBuildingLevels } from './FiefBuildingLevels'

export const entryFitsProjection = (
  projectedLevels: FiefBuildingLevels,
  entry: BuildQueueEntry,
  catalog: BuildingCatalog,
): Result<boolean, DomainError> => {
  if (entry.targetLevel !== projectedLevels[entry.building] + 1) {
    return ok(false)
  }
  const supplied = deriveSuppliedPeasants(projectedLevels.farm, catalog)
  if (!supplied.ok) {
    return supplied
  }
  const occupied = deriveOccupiedPeasants(projectedLevels, catalog)
  if (!occupied.ok) {
    return occupied
  }
  const required = derivePeasantsForUpgrade(
    projectedLevels,
    entry.building,
    entry.targetLevel,
    catalog,
  )
  if (!required.ok) {
    return required
  }
  return ok(required.value <= supplied.value - occupied.value)
}
