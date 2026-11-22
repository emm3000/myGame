import type { TownOverview } from '@mygame/contracts'
import {
  type BuildingKind,
  type BuildingLevel,
  buildingKinds,
  buildPercentAt,
  type DomainError,
  deriveBuildDurationSeconds,
  derivePeopleForWork,
  type HeldCard,
  ok,
  type Result,
  type TownCatalog,
  wordShortfallOf,
} from '@mygame/domain'
import type { TownReading } from '../../../application/TownReading'

type BuildingState = TownOverview['buildings'][BuildingKind]

type WordsNeeded = NonNullable<BuildingState['nextLevel']>['wordsNeeded']

const wordsNeededOf = (
  next: BuildingLevel,
  cards: ReadonlyArray<HeldCard>,
  catalog: TownCatalog,
): WordsNeeded => {
  const shortfall = wordShortfallOf(next.level, cards, catalog.townSettings().wordNeed)
  return shortfall === null ? null : { count: shortfall.needed, standing: shortfall.standing }
}

const nextLevelOf = (
  building: BuildingKind,
  { town, cards }: TownReading,
  catalog: TownCatalog,
  buildPercent: number,
): Result<BuildingState['nextLevel'], DomainError> => {
  const projected = town.projectedLevels
  const next = catalog.levelOf(building, projected[building] + 1)
  if (next?.building !== building) {
    return ok(null)
  }
  const people = derivePeopleForWork(projected, town.staffedHires, next, catalog)
  if (!people.ok) {
    return people
  }
  return ok({
    level: next.level,
    cost: { ...next.cost },
    durationSeconds: deriveBuildDurationSeconds(next.durationSeconds, buildPercent),
    people: people.value.needed,
    wordsNeeded: wordsNeededOf(next, cards, catalog),
  })
}

export const presentTownBuildings = (
  reading: TownReading,
  catalog: TownCatalog,
): Result<TownOverview['buildings'], DomainError> => {
  const levels = reading.town.buildingLevels
  const buildings: Record<BuildingKind, BuildingState> = {
    homes: { level: levels.homes, nextLevel: null },
    farm: { level: levels.farm, nextLevel: null },
    factory: { level: levels.factory, nextLevel: null },
    powerStation: { level: levels.powerStation, nextLevel: null },
    storage: { level: levels.storage, nextLevel: null },
    school: { level: levels.school, nextLevel: null },
    office: { level: levels.office, nextLevel: null },
  }
  const buildPercent = buildPercentAt(reading.at, catalog.townSettings())
  for (const building of buildingKinds) {
    const nextLevel = nextLevelOf(building, reading, catalog, buildPercent)
    if (!nextLevel.ok) {
      return nextLevel
    }
    buildings[building] = { ...buildings[building], nextLevel: nextLevel.value }
  }
  return ok(buildings)
}
