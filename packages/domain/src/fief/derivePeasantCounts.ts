import type { DomainError } from '../DomainError'
import type { BuildingCatalog } from '../ports/BuildingCatalog'
import { ok, type Result } from '../Result'
import { deriveFreePeasants } from './deriveFreePeasants'
import { deriveOccupiedPeasants } from './deriveOccupiedPeasants'
import { deriveSuppliedPeasants } from './deriveSuppliedPeasants'
import type { FiefBuildingLevels } from './FiefBuildingLevels'
import type { FiefUnitCounts } from './FiefUnitCounts'
import { unitKinds } from './unitKinds'

export interface PeasantCounts {
  readonly supplied: number
  readonly occupied: number
  readonly free: number
}

const unitPeasantsOf = (units: FiefUnitCounts, catalog: BuildingCatalog): number => {
  const terms = catalog.fiefSettings().units
  return unitKinds.reduce(
    (occupied, unit) => occupied + units.countOf(unit) * terms[unit].peasantOccupancy,
    0,
  )
}

export const derivePeasantCounts = (
  buildingLevels: FiefBuildingLevels,
  units: FiefUnitCounts,
  catalog: BuildingCatalog,
): Result<PeasantCounts, DomainError> => {
  const supplied = deriveSuppliedPeasants(buildingLevels.farm, catalog)
  if (!supplied.ok) {
    return supplied
  }
  const buildingPeasants = deriveOccupiedPeasants(buildingLevels, catalog)
  if (!buildingPeasants.ok) {
    return buildingPeasants
  }
  const occupied = buildingPeasants.value + unitPeasantsOf(units, catalog)
  const free = deriveFreePeasants(supplied.value, occupied)
  if (!free.ok) {
    return free
  }
  return ok({ supplied: supplied.value, occupied, free: free.value })
}
