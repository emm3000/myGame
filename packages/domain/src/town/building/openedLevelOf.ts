import type { HeldCard } from '#learning/HeldCard'
import type { TownCatalog } from '../domain/TownCatalog'
import { buildingKinds } from './buildingKinds'
import { wordShortfallOf } from './wordShortfallOf'

const isBuildableLevel = (level: number, catalog: TownCatalog): boolean =>
  buildingKinds.some((building) => catalog.levelOf(building, level) !== undefined)

const buildableLevelsFrom = (level: number, catalog: TownCatalog): ReadonlyArray<number> =>
  isBuildableLevel(level, catalog) ? [level, ...buildableLevelsFrom(level + 1, catalog)] : []

export const openedLevelOf = (
  before: ReadonlyArray<HeldCard>,
  after: ReadonlyArray<HeldCard>,
  catalog: TownCatalog,
): number | null => {
  const { wordNeed } = catalog.townSettings()
  const opened = buildableLevelsFrom(wordNeed.fromLevel, catalog).filter(
    (level) =>
      wordShortfallOf(level, before, wordNeed) !== null &&
      wordShortfallOf(level, after, wordNeed) === null,
  )
  return opened.at(-1) ?? null
}
