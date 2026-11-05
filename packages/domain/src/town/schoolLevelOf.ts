import type { DomainError } from '../DomainError'
import { err, ok, type Result } from '../Result'
import type { SchoolLevel } from './BuildingLevel'
import type { TownCatalog } from './TownCatalog'

export const schoolLevelOf = (
  level: number,
  catalog: TownCatalog,
): Result<SchoolLevel, DomainError> => {
  const found = catalog.levelOf('school', level)
  if (found?.building !== 'school') {
    return err({ kind: 'UnknownTownBuildingLevel', building: 'school', level })
  }
  return ok(found)
}
