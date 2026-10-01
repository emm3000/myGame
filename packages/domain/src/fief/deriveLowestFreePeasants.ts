import type { DomainError } from '../DomainError'
import type { BuildingCatalog } from '../ports/BuildingCatalog'
import { ok, type Result } from '../Result'
import type { UpgradeTarget } from './BuildQueue'
import { derivePeasantCounts } from './derivePeasantCounts'
import type { Fief } from './Fief'
import type { FiefBuildingLevels } from './FiefBuildingLevels'

const upgradesOf = (fief: Fief): ReadonlyArray<UpgradeTarget> =>
  fief.slot.kind === 'busy' ? [fief.slot, ...fief.buildQueue] : fief.buildQueue

const stepsOf = (fief: Fief): ReadonlyArray<FiefBuildingLevels> =>
  upgradesOf(fief).reduce<ReadonlyArray<FiefBuildingLevels>>(
    (steps, { building, targetLevel }) => {
      const previous = steps.at(-1) ?? fief.buildingLevels
      return [...steps, { ...previous, [building]: targetLevel }]
    },
    [fief.buildingLevels],
  )

export const deriveLowestFreePeasants = (
  fief: Fief,
  catalog: BuildingCatalog,
): Result<number, DomainError> => {
  const free: Array<number> = []
  for (const levels of stepsOf(fief)) {
    const counts = derivePeasantCounts(levels, fief.units, fief.recruitOrder, catalog)
    if (!counts.ok) {
      return counts
    }
    free.push(counts.value.free)
  }
  return ok(Math.min(...free))
}
