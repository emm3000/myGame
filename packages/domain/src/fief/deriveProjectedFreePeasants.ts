import type { DomainError } from '../DomainError'
import type { BuildingCatalog } from '../ports/BuildingCatalog'
import { ok, type Result } from '../Result'
import { derivePeasantCounts } from './derivePeasantCounts'
import type { Fief } from './Fief'
import { FiefUnitCounts } from './FiefUnitCounts'

export const deriveProjectedFreePeasants = (
  fief: Fief,
  catalog: BuildingCatalog,
): Result<number, DomainError> => {
  const projected = derivePeasantCounts(fief.projectedBuildingLevels, fief.units, catalog)
  if (!projected.ok) {
    return projected
  }
  return ok(projected.value.free)
}
