import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { type BuildingKind, buildingKinds, type TownCatalog } from '@mygame/domain'
import { z } from 'zod'
import { JsonTownCatalog } from '../infrastructure/json/JsonTownCatalog'
import { readLessonContentFiles } from '../infrastructure/json/readLessonContentFiles'
import type { GateContent } from './GateContent'

const englishCatalog = fileURLToPath(
  new URL('../../../../../packages/catalog/en.json', import.meta.url),
)

const levelsOf = (catalog: TownCatalog, building: BuildingKind): ReadonlyArray<number> => {
  const levels: Array<number> = []
  for (let level = 1; catalog.levelOf(building, level) !== undefined; level += 1) {
    levels.push(level)
  }
  return levels
}

const topBuildingLevelOf = (catalog: TownCatalog): number =>
  Math.max(...buildingKinds.map((building) => levelsOf(catalog, building).length))

export const readGateContent = (directory: string): GateContent => {
  const town = JsonTownCatalog.fromDirectory(join(directory, 'town'))
  return {
    ...readLessonContentFiles(directory),
    englishMessages: z
      .record(z.string(), z.string())
      .parse(JSON.parse(readFileSync(englishCatalog, 'utf8'))),
    wordNeed: town.townSettings().wordNeed,
    schoolLevels: levelsOf(town, 'school'),
    topBuildingLevel: topBuildingLevelOf(town),
  }
}
