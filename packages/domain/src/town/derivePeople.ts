import type { DomainError } from '../DomainError'
import { err, ok, type Result } from '../Result'
import type { BuildingLevels } from './BuildingLevels'
import { buildingKinds } from './buildingKinds'
import type { Hires } from './Hires'
import { hireKinds } from './hireKinds'
import type { People } from './People'
import type { TownCatalog } from './TownCatalog'

export const deriveSuppliedPeople = (
  homesLevel: number,
  catalog: TownCatalog,
): Result<number, DomainError> => {
  const { basePeople } = catalog.townSettings()
  if (homesLevel === 0) {
    return ok(basePeople)
  }
  const found = catalog.levelOf('homes', homesLevel)
  if (found?.building !== 'homes') {
    return err({ kind: 'UnknownTownBuildingLevel', building: 'homes', level: homesLevel })
  }
  return ok(basePeople + found.peopleSupplied)
}

const deriveOccupiedPeople = (
  levels: BuildingLevels,
  catalog: TownCatalog,
): Result<number, DomainError> => {
  let occupied = 0
  for (const building of buildingKinds) {
    const level = levels[building]
    if (level === 0) {
      continue
    }
    const found = catalog.levelOf(building, level)
    if (found?.building !== building) {
      return err({ kind: 'UnknownTownBuildingLevel', building, level })
    }
    occupied += found.people
  }
  return ok(occupied)
}

const hiredPeopleOf = (hires: Hires, catalog: TownCatalog): number =>
  hireKinds.reduce((people, hire) => people + hires[hire] * catalog.hireTermsOf(hire).people, 0)

export const derivePeople = (
  levels: BuildingLevels,
  hires: Hires,
  catalog: TownCatalog,
): Result<People, DomainError> => {
  const supplied = deriveSuppliedPeople(levels.homes, catalog)
  if (!supplied.ok) {
    return supplied
  }
  const occupied = deriveOccupiedPeople(levels, catalog)
  if (!occupied.ok) {
    return occupied
  }
  const occupiedWithHires = occupied.value + hiredPeopleOf(hires, catalog)
  return ok({
    supplied: supplied.value,
    occupied: occupiedWithHires,
    free: supplied.value - occupiedWithHires,
  })
}
