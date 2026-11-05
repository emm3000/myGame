import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  type BuildingContent,
  BuildingContentSchema,
  type TownContent,
  TownContentSchema,
} from '@mygame/contracts/town'
import { Instant } from '@mygame/domain'
import type { BuildingKind, BuildingLevel, TownCatalog, TownSettings } from '@mygame/domain/town'

const buildingFiles: Readonly<Record<BuildingKind, string>> = {
  homes: 'homes.json',
  farm: 'farm.json',
  factory: 'factory.json',
  powerStation: 'powerStation.json',
  storage: 'storage.json',
  school: 'school.json',
  office: 'office.json',
}

const settingsFile = 'town.json'

const parseFile = <T>(directory: string, file: string, schema: { parse(input: unknown): T }): T => {
  const path = join(directory, file)
  try {
    return schema.parse(JSON.parse(readFileSync(path, 'utf8')))
  } catch (cause) {
    throw new Error(`Content file ${path} is malformed`, { cause })
  }
}

const buildingLevelsOf = (content: BuildingContent): ReadonlyArray<BuildingLevel> => {
  switch (content.building) {
    case 'homes':
      return content.levels.map(({ effect, ...level }) => ({
        ...level,
        building: content.building,
        peopleSupplied: effect.peopleSupplied,
      }))
    case 'farm':
    case 'factory':
    case 'powerStation':
      return content.levels.map(({ effect, ...level }) => ({
        ...level,
        building: content.building,
        ratePerHour: effect.ratePerHour,
      }))
    case 'storage':
      return content.levels.map(({ effect, ...level }) => ({
        ...level,
        building: content.building,
        capacityUnits: effect.capacity,
      }))
    case 'school':
      return content.levels.map(({ effect, ...level }) => ({
        ...level,
        building: content.building,
        lessonPercent: effect.lessonPercent,
        learningCap: effect.learningCap,
      }))
    case 'office':
      return content.levels.map(({ effect, ...level }) => ({
        ...level,
        building: content.building,
        hires: effect.hires,
      }))
    default: {
      const unreachable: never = content
      return unreachable
    }
  }
}

const settingsOf = (town: TownContent): TownSettings => ({
  ...town,
  seasons: {
    ...town.seasons,
    epoch: Instant.fromEpochMilliseconds(Date.parse(town.seasons.epoch)),
  },
})

const keyOf = (building: BuildingKind, level: number): string => `${building}:${level}`

export class JsonTownCatalog implements TownCatalog {
  private readonly levels: ReadonlyMap<string, BuildingLevel>
  private readonly settings: TownSettings

  constructor(buildings: ReadonlyArray<BuildingContent>, town: TownContent) {
    this.levels = new Map(
      buildings
        .flatMap(buildingLevelsOf)
        .map((level) => [keyOf(level.building, level.level), level]),
    )
    this.settings = settingsOf(town)
  }

  static fromDirectory(directory: string): JsonTownCatalog {
    const buildings = Object.entries(buildingFiles).map(([building, file]) => {
      const content = parseFile(directory, file, BuildingContentSchema)
      if (content.building !== building) {
        throw new Error(`Content file ${join(directory, file)} describes ${content.building}`)
      }
      return content
    })
    return new JsonTownCatalog(buildings, parseFile(directory, settingsFile, TownContentSchema))
  }

  levelOf(building: BuildingKind, level: number): BuildingLevel | undefined {
    return this.levels.get(keyOf(building, level))
  }

  townSettings(): TownSettings {
    return this.settings
  }
}
