import {
  type BuildingKind,
  type BuildingLevel,
  buildingKinds,
  type DomainError,
  derivePeopleForWork,
  levelWorkAt,
  ok,
  type Result,
  type Stocks,
  type TownCatalog,
  type WordShortfall,
  wordShortfallOf,
} from '@mygame/domain'
import type { TownReading } from '../../application/TownReading'

export type NextLevelView = {
  readonly level: number
  readonly cost: Stocks
  readonly durationSeconds: number
  readonly people: number
  readonly wordsNeeded: WordShortfall | null
}

export type BuildingView = {
  readonly level: number
  readonly nextLevel: NextLevelView | null
}

export type BuildingsView = Readonly<Record<BuildingKind, BuildingView>>

const nextLevelViewOf = (
  next: BuildingLevel,
  { town, at, cards }: TownReading,
  catalog: TownCatalog,
): Result<NextLevelView, DomainError> => {
  const people = derivePeopleForWork(town.projectedLevels, town.staffedHires, next, catalog)
  if (!people.ok) {
    return people
  }
  const { level, cost, durationSeconds } = levelWorkAt(next, at, catalog.townSettings())
  return ok({
    level,
    cost,
    durationSeconds,
    people: people.value.needed,
    wordsNeeded: wordShortfallOf(next.level, cards, catalog.townSettings().wordNeed),
  })
}

const nextLevelOf = (
  building: BuildingKind,
  reading: TownReading,
  catalog: TownCatalog,
): Result<NextLevelView | null, DomainError> => {
  const next = catalog.levelOf(building, reading.town.projectedLevels[building] + 1)
  return next?.building === building ? nextLevelViewOf(next, reading, catalog) : ok(null)
}

export const gatherBuildingsView = (
  reading: TownReading,
  catalog: TownCatalog,
): Result<BuildingsView, DomainError> => {
  const levels = reading.town.buildingLevels
  const buildings: Record<BuildingKind, BuildingView> = {
    homes: { level: levels.homes, nextLevel: null },
    farm: { level: levels.farm, nextLevel: null },
    factory: { level: levels.factory, nextLevel: null },
    powerStation: { level: levels.powerStation, nextLevel: null },
    storage: { level: levels.storage, nextLevel: null },
    school: { level: levels.school, nextLevel: null },
    office: { level: levels.office, nextLevel: null },
  }
  for (const building of buildingKinds) {
    const nextLevel = nextLevelOf(building, reading, catalog)
    if (!nextLevel.ok) {
      return nextLevel
    }
    buildings[building] = { ...buildings[building], nextLevel: nextLevel.value }
  }
  return ok(buildings)
}
