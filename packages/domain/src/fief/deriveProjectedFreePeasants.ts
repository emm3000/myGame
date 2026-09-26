import type { DomainError } from '../DomainError'
import type { BuildingCatalog } from '../ports/BuildingCatalog'
import type { Result } from '../Result'
import { deriveFreePeasants } from './deriveFreePeasants'
import { deriveOccupiedPeasants } from './deriveOccupiedPeasants'
import { deriveSuppliedPeasants } from './deriveSuppliedPeasants'
import type { Fief } from './Fief'

export const deriveProjectedFreePeasants = (
  fief: Fief,
  catalog: BuildingCatalog,
): Result<number, DomainError> => {
  const projectedLevels = fief.projectedBuildingLevels
  const supplied = deriveSuppliedPeasants(projectedLevels.farm, catalog)
  if (!supplied.ok) {
    return supplied
  }
  const occupied = deriveOccupiedPeasants(projectedLevels, catalog)
  if (!occupied.ok) {
    return occupied
  }
  return deriveFreePeasants(supplied.value, occupied.value)
}
