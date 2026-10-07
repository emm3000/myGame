import type { DomainError } from '../DomainError'
import type { BuildingCatalog } from '../ports/BuildingCatalog'
import { ok, type Result } from '../Result'
import type { ResourceKind } from '../resources/Resources'
import { resourceKinds } from '../resources/resourceKinds'
import { deriveWarehouseCapacity } from './deriveWarehouseCapacity'
import type { Fief } from './Fief'
import { isStoreFull } from './isStoreFull'

export const fullStoresOf = (
  fief: Fief,
  catalog: BuildingCatalog,
): Result<ReadonlyArray<ResourceKind>, DomainError> => {
  const capacityUnits = deriveWarehouseCapacity(fief.buildingLevels.warehouse, catalog)
  if (!capacityUnits.ok) {
    return capacityUnits
  }
  return ok(resourceKinds.filter((kind) => isStoreFull(fief.stocks, kind, capacityUnits.value)))
}
