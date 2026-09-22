import type { DomainError } from '../DomainError'
import type { BuildingCatalog, BuildingKind } from '../ports/BuildingCatalog'
import { err, ok, type Result } from '../Result'
import type { FiefBuildingLevels } from './FiefBuildingLevels'

const ALL_BUILDINGS: ReadonlyArray<BuildingKind> = [
  'sawmill',
  'quarry',
  'ironMine',
  'farm',
  'warehouse',
]

export const deriveOccupiedPeasants = (
  buildingLevels: FiefBuildingLevels,
  catalog: BuildingCatalog,
): Result<number, DomainError> => {
  let occupiedPeasants = 0

  for (const building of ALL_BUILDINGS) {
    const level = buildingLevels[building]
    if (level === 0) {
      continue
    }
    const found = catalog.levelOf(building, level)
    if (found === undefined) {
      return err({ kind: 'UnknownBuildingLevel', building, level })
    }
    occupiedPeasants += found.peasantOccupancy
  }

  return ok(occupiedPeasants)
}
