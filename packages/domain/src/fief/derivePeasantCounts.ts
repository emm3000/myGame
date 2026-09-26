import type { DomainError } from '../DomainError'
import type { BuildingCatalog } from '../ports/BuildingCatalog'
import { ok, type Result } from '../Result'
import { deriveFreePeasants } from './deriveFreePeasants'
import { deriveOccupiedPeasants } from './deriveOccupiedPeasants'
import { deriveSuppliedPeasants } from './deriveSuppliedPeasants'
import type { FiefBuildingLevels } from './FiefBuildingLevels'

export interface PeasantCounts {
  readonly supplied: number
  readonly occupied: number
  readonly free: number
}

export const derivePeasantCounts = (
  buildingLevels: FiefBuildingLevels,
  catalog: BuildingCatalog,
): Result<PeasantCounts, DomainError> => {
  const supplied = deriveSuppliedPeasants(buildingLevels.farm, catalog)
  if (!supplied.ok) {
    return supplied
  }
  const occupied = deriveOccupiedPeasants(buildingLevels, catalog)
  if (!occupied.ok) {
    return occupied
  }
  const free = deriveFreePeasants(supplied.value, occupied.value)
  if (!free.ok) {
    return free
  }
  return ok({ supplied: supplied.value, occupied: occupied.value, free: free.value })
}
