import type { DomainError } from '#DomainError'
import { ok, type Result } from '#Result'
import { derivePeople } from '../../domain/derivePeople'
import type { TownCatalog } from '../../domain/TownCatalog'
import type { Hires } from '../../hiring/domain/Hires'
import type { BuildingLevel } from './BuildingLevel'
import type { BuildingLevels } from './BuildingLevels'

export type PeopleForWork = {
  readonly needed: number
  readonly freeBefore: number
  readonly freeAfter: number
}

export const derivePeopleForWork = (
  projected: BuildingLevels,
  hires: Hires,
  next: BuildingLevel,
  catalog: TownCatalog,
): Result<PeopleForWork, DomainError> => {
  const before = derivePeople(projected, hires, catalog)
  if (!before.ok) {
    return before
  }
  const after = derivePeople({ ...projected, [next.building]: next.level }, hires, catalog)
  if (!after.ok) {
    return after
  }
  return ok({
    needed: after.value.occupied - before.value.occupied,
    freeBefore: before.value.free,
    freeAfter: after.value.free,
  })
}
