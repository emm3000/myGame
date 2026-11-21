import type { DomainError } from '#DomainError'
import { err, ok, type Result } from '#Result'
import type { TownCatalog } from '../ports/TownCatalog'
import type { SchoolLevel } from './SchoolLevel'

export const schoolLevelOf = (
  level: number,
  catalog: TownCatalog,
): Result<SchoolLevel, Extract<DomainError, { readonly kind: 'UnknownTownBuildingLevel' }>> => {
  const found = catalog.levelOf('school', level)
  if (found?.building !== 'school') {
    return err({ kind: 'UnknownTownBuildingLevel', building: 'school', level })
  }
  return ok(found)
}
