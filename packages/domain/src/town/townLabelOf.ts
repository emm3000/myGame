import type { DomainError } from '../DomainError'
import { ok, type Result } from '../Result'
import type { BuildingLevels } from './BuildingLevels'
import { deriveSuppliedPeople } from './derivePeople'
import type { TownCatalog } from './TownCatalog'
import type { TownLabel } from './TownLabel'

export const townLabelOf = (
  levels: BuildingLevels,
  catalog: TownCatalog,
): Result<TownLabel, DomainError> => {
  const supplied = deriveSuppliedPeople(levels.homes, catalog)
  if (!supplied.ok) {
    return supplied
  }
  return ok(supplied.value >= catalog.townSettings().cityPeople ? 'city' : 'town')
}
