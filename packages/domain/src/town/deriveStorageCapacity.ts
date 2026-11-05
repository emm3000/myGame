import type { DomainError } from '../DomainError'
import { err, ok, type Result } from '../Result'
import type { TownCatalog } from './TownCatalog'

export const deriveStorageCapacity = (
  storageLevel: number,
  catalog: TownCatalog,
): Result<number, DomainError> => {
  if (storageLevel === 0) {
    return ok(catalog.townSettings().storageBaseCapacity)
  }
  const found = catalog.levelOf('storage', storageLevel)
  if (found?.building !== 'storage') {
    return err({ kind: 'UnknownTownBuildingLevel', building: 'storage', level: storageLevel })
  }
  return ok(found.capacityUnits)
}
