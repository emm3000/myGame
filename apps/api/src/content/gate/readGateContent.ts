import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { type BuildingKind, buildingKinds, headwordOf, type TownCatalog } from '@mygame/domain'
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

const spokenHeader = 'Lemma,Rank,SFI,U'

const unrankedField = '#N/A'

const transcriptionTags: ReadonlySet<string> = new Set(['pause', 'unclear', 'laugh'])

const decimal = z.string().regex(/^\d+(\.\d+)?$/)

const SpokenRowSchema = z.tuple([
  z.string().regex(/^[A-Za-z]+$/),
  z
    .string()
    .regex(/^[1-9]\d*$/)
    .transform(Number),
  decimal,
  decimal,
])

const spokenRowsOf = (path: string): ReadonlyArray<ReadonlyArray<string>> => {
  const [header, ...rows] = readFileSync(path, 'utf8').split(/\r?\n/)
  if (header !== spokenHeader) {
    throw new Error(`unexpected header ${header}`)
  }
  return rows
    .filter((row) => row !== '')
    .map((row) => row.split(','))
    .filter(([, rank]) => rank !== unrankedField)
}

const spokenRanksOfFile = (directory: string): ReadonlyMap<string, number> => {
  const path = join(directory, 'lessons', 'ngsl-spoken-1.2.csv')
  try {
    return new Map(
      spokenRowsOf(path)
        .map((row) => SpokenRowSchema.parse(row))
        .map(([lemma, rank]) => [headwordOf(lemma), rank] as const)
        .filter(([lemma]) => !transcriptionTags.has(lemma)),
    )
  } catch (cause) {
    throw new Error(`Content file ${path} is malformed`, { cause })
  }
}

export const readGateContent = (directory: string): GateContent => {
  const town = JsonTownCatalog.fromDirectory(join(directory, 'town'))
  return {
    ...readLessonContentFiles(directory),
    spokenRanks: spokenRanksOfFile(directory),
    englishMessages: z
      .record(z.string(), z.string())
      .parse(JSON.parse(readFileSync(englishCatalog, 'utf8'))),
    wordNeed: town.townSettings().wordNeed,
    schoolLevels: levelsOf(town, 'school'),
    topBuildingLevel: topBuildingLevelOf(town),
  }
}
