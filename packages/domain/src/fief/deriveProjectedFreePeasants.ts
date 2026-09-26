import type { DomainError } from '../DomainError'
import type { BuildingCatalog } from '../ports/BuildingCatalog'
import { ok, type Result } from '../Result'
import { derivePeasantCounts } from './derivePeasantCounts'
import type { Fief } from './Fief'

export const deriveProjectedFreePeasants = (
  fief: Fief,
  catalog: BuildingCatalog,
): Result<number, DomainError> => {
  const projected = derivePeasantCounts(fief.projectedBuildingLevels, catalog)
  if (!projected.ok) {
    return projected
  }
  return ok(projected.value.free)
}
