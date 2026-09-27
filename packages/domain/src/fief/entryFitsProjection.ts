import type { DomainError } from '../DomainError'
import type { BuildingCatalog } from '../ports/BuildingCatalog'
import { ok, type Result } from '../Result'
import type { BuildQueueEntry } from './BuildQueue'
import { derivePeasantCounts } from './derivePeasantCounts'
import { derivePeasantsForUpgrade } from './derivePeasantsForUpgrade'
import type { FiefBuildingLevels } from './FiefBuildingLevels'

export const entryFitsProjection = (
  projectedLevels: FiefBuildingLevels,
  entry: BuildQueueEntry,
  catalog: BuildingCatalog,
): Result<boolean, DomainError> => {
  if (entry.targetLevel !== projectedLevels[entry.building] + 1) {
    return ok(false)
  }
  const peasants = derivePeasantCounts(projectedLevels, catalog)
  if (!peasants.ok) {
    return peasants.error.kind === 'NegativeFreePeasants' ? ok(false) : peasants
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
  return ok(required.value <= peasants.value.free)
}
