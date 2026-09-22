import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  type BuildingContent,
  BuildingContentSchema,
  type FiefContent,
  FiefContentSchema,
} from '@mygame/contracts'
import type { BuildingCatalog, BuildingKind, BuildingLevel, FiefSettings } from '@mygame/domain'

const buildingFiles: Readonly<Record<BuildingKind, string>> = {
  sawmill: 'sawmill.json',
  quarry: 'quarry.json',
  ironMine: 'iron-mine.json',
  farm: 'farm.json',
  warehouse: 'warehouse.json',
}

const fiefFile = 'fief.json'

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
    case 'sawmill':
    case 'quarry':
    case 'ironMine':
      return content.levels.map(({ effect, ...level }) => ({
        ...level,
        building: content.building,
        ratePerHour: effect.ratePerHour,
      }))
    case 'farm':
      return content.levels.map(({ effect, ...level }) => ({
        ...level,
        building: content.building,
        ratePerHour: effect.ratePerHour,
        peasantSupply: effect.peasantSupply,
      }))
    case 'warehouse':
      return content.levels.map(({ effect, ...level }) => ({
        ...level,
        building: content.building,
        capacityUnits: effect.capacity,
      }))
    default: {
      const unreachable: never = content
      return unreachable
    }
  }
}

export class JsonBuildingCatalog implements BuildingCatalog {
  private readonly levels: ReadonlyMap<string, BuildingLevel>
  private readonly settings: FiefSettings

  constructor(buildings: ReadonlyArray<BuildingContent>, fief: FiefContent) {
    this.levels = new Map(
      buildings
        .flatMap(buildingLevelsOf)
        .map((level) => [JsonBuildingCatalog.keyOf(level.building, level.level), level]),
    )
    this.settings = fief
  }

  static fromDirectory(directory: string): JsonBuildingCatalog {
    const buildings = Object.entries(buildingFiles).map(([building, file]) => {
      const content = parseFile(directory, file, BuildingContentSchema)
      if (content.building !== building) {
        throw new Error(`Content file ${join(directory, file)} describes ${content.building}`)
      }
      return content
    })
    return new JsonBuildingCatalog(buildings, parseFile(directory, fiefFile, FiefContentSchema))
  }

  levelOf(building: BuildingKind, level: number): BuildingLevel | undefined {
    return this.levels.get(JsonBuildingCatalog.keyOf(building, level))
  }

  fiefSettings(): FiefSettings {
    return this.settings
  }

  private static keyOf(building: BuildingKind, level: number): string {
    return `${building}:${level}`
  }
}
