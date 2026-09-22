import type { DomainError } from '../DomainError'
import type { BuildingCatalog, BuildingKind } from '../ports/BuildingCatalog'
import { err, ok, type Result } from '../Result'
import type { FiefBuildingLevels } from './FiefBuildingLevels'

const occupancyOf = (
  catalog: BuildingCatalog,
  building: BuildingKind,
  level: number,
): Result<number, DomainError> => {
  if (level === 0) {
    return ok(0)
  }
  const found = catalog.levelOf(building, level)
  if (found === undefined) {
    return err({ kind: 'UnknownBuildingLevel', building, level })
  }
  return ok(found.peasantOccupancy)
}

export const deriveOccupiedPeasants = (
  buildingLevels: FiefBuildingLevels,
  catalog: BuildingCatalog,
): Result<number, DomainError> => {
  const occupancyByBuilding: Record<BuildingKind, Result<number, DomainError>> = {
    sawmill: occupancyOf(catalog, 'sawmill', buildingLevels.sawmill),
    quarry: occupancyOf(catalog, 'quarry', buildingLevels.quarry),
    ironMine: occupancyOf(catalog, 'ironMine', buildingLevels.ironMine),
    farm: occupancyOf(catalog, 'farm', buildingLevels.farm),
    warehouse: occupancyOf(catalog, 'warehouse', buildingLevels.warehouse),
  }

  let occupiedPeasants = 0
  for (const occupancy of Object.values(occupancyByBuilding)) {
    if (!occupancy.ok) {
      return occupancy
    }
    occupiedPeasants += occupancy.value
  }

  return ok(occupiedPeasants)
}
