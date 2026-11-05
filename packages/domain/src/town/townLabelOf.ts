import type { DomainError } from '../DomainError'
import { ok, type Result } from '../Result'
import type { BuildingLevels } from './BuildingLevels'
import { derivePeople } from './derivePeople'
import type { TownCatalog } from './TownCatalog'
import type { TownLabel } from './TownLabel'

export const townLabelOf = (
  levels: BuildingLevels,
  catalog: TownCatalog,
): Result<TownLabel, DomainError> => {
  const people = derivePeople(levels, catalog)
  if (!people.ok) {
    return people
  }
  return ok(people.value.supplied >= catalog.townSettings().cityPeople ? 'city' : 'town')
}
