import type { DomainError } from '../DomainError'
import type { BuildingCatalog, BuildingKind } from '../ports/BuildingCatalog'
import { ok, type Result } from '../Result'
import { deriveOccupiedPeasants } from './deriveOccupiedPeasants'
import type { FiefBuildingLevels } from './FiefBuildingLevels'

export const derivePeasantsForUpgrade = (
  buildingLevels: FiefBuildingLevels,
  building: BuildingKind,
  targetLevel: number,
  catalog: BuildingCatalog,
): Result<number, DomainError> => {
  const occupiedNow = deriveOccupiedPeasants(buildingLevels, catalog)
  if (!occupiedNow.ok) {
    return occupiedNow
  }
  const occupiedAfter = deriveOccupiedPeasants(
    { ...buildingLevels, [building]: targetLevel },
    catalog,
  )
  if (!occupiedAfter.ok) {
    return occupiedAfter
  }
  return ok(occupiedAfter.value - occupiedNow.value)
}
