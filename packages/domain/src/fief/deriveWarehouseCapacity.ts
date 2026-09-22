import type { DomainError } from '../DomainError'
import type { BuildingCatalog } from '../ports/BuildingCatalog'
import { err, ok, type Result } from '../Result'

export const deriveWarehouseCapacity = (
  warehouseLevel: number,
  catalog: BuildingCatalog,
): Result<number, DomainError> => {
  if (warehouseLevel === 0) {
    return ok(catalog.fiefSettings().startingCapacity)
  }
  const found = catalog.levelOf('warehouse', warehouseLevel)
  if (found === undefined) {
    return err({ kind: 'UnknownBuildingLevel', building: 'warehouse', level: warehouseLevel })
  }
  return ok(found.capacityUnits)
}
