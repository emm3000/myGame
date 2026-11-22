import type { DomainError } from '#DomainError'
import { ok, type Result } from '#Result'
import type { BuildingLevels } from '../building/domain/BuildingLevels'
import type { WorkTarget } from '../building/domain/BuildingWork'
import { derivePeople } from '../domain/derivePeople'
import type { Town } from '../domain/Town'
import type { TownCatalog } from '../domain/TownCatalog'

const scheduleOf = (town: Town): ReadonlyArray<BuildingLevels> => {
  const slot = town.workSlot
  const planned: ReadonlyArray<WorkTarget> =
    slot.kind === 'busy' ? [slot, ...town.waitingList] : town.waitingList
  const steps: Array<BuildingLevels> = [town.buildingLevels]
  for (const { building, level } of planned) {
    const previous = steps[steps.length - 1] ?? town.buildingLevels
    steps.push({ ...previous, [building]: level })
  }
  return steps
}

export const lowestFreePeopleOf = (
  town: Town,
  catalog: TownCatalog,
): Result<number, DomainError> => {
  let lowest = Number.POSITIVE_INFINITY
  for (const levels of scheduleOf(town)) {
    const people = derivePeople(levels, town.staffedHires, catalog)
    if (!people.ok) {
      return people
    }
    lowest = Math.min(lowest, people.value.free)
  }
  return ok(lowest)
}
