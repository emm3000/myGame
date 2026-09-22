import type { DomainError } from '../DomainError'
import type { BuildingCatalog } from '../ports/BuildingCatalog'
import { err, ok, type Result } from '../Result'

export const deriveSuppliedPeasants = (
  farmLevel: number,
  catalog: BuildingCatalog,
): Result<number, DomainError> => {
  const basePeasantSupply = catalog.fiefSettings().basePeasantSupply
  if (farmLevel === 0) {
    return ok(basePeasantSupply)
  }
  const found = catalog.levelOf('farm', farmLevel)
  if (found === undefined || found.building !== 'farm') {
    return err({ kind: 'UnknownBuildingLevel', building: 'farm', level: farmLevel })
  }
  return ok(basePeasantSupply + found.peasantSupply)
}
