import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  type ArtContent,
  ArtContentSchema,
  type BuildingContent,
  BuildingContentSchema,
  type FiefContent,
  FiefContentSchema,
} from '@mygame/contracts'
import type {
  ArtKind,
  ArtLevel,
  BuildingCatalog,
  BuildingKind,
  BuildingLevel,
  FiefSettings,
} from '@mygame/domain'

const buildingFiles: Readonly<Record<BuildingKind, string>> = {
  sawmill: 'sawmill.json',
  quarry: 'quarry.json',
  ironMine: 'iron-mine.json',
  farm: 'farm.json',
  warehouse: 'warehouse.json',
  library: 'library.json',
}

const artFiles: Readonly<Record<ArtKind, string>> = {
  smithing: join('arts', 'smithing.json'),
  masonry: join('arts', 'masonry.json'),
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
    case 'library':
      return content.levels.map((level) => ({ ...level, building: content.building }))
    default: {
      const unreachable: never = content
      return unreachable
    }
  }
}

const artLevelsOf = (content: ArtContent): ReadonlyArray<ArtLevel> =>
  content.levels.map(({ effect, ...level }) => ({
    ...level,
    art: content.art,
    resource: content.resource,
    ratePercent: effect.ratePercent,
  }))

export class JsonBuildingCatalog implements BuildingCatalog {
  private readonly levels: ReadonlyMap<string, BuildingLevel>
  private readonly artLevels: ReadonlyMap<string, ArtLevel>
  private readonly settings: FiefSettings

  constructor(
    buildings: ReadonlyArray<BuildingContent>,
    arts: ReadonlyArray<ArtContent>,
    fief: FiefContent,
  ) {
    this.levels = new Map(
      buildings
        .flatMap(buildingLevelsOf)
        .map((level) => [JsonBuildingCatalog.keyOf(level.building, level.level), level]),
    )
    this.artLevels = new Map(
      arts
        .flatMap(artLevelsOf)
        .map((level) => [JsonBuildingCatalog.keyOf(level.art, level.level), level]),
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
    const arts = Object.entries(artFiles).map(([art, file]) => {
      const content = parseFile(directory, file, ArtContentSchema)
      if (content.art !== art) {
        throw new Error(`Content file ${join(directory, file)} describes ${content.art}`)
      }
      return content
    })
    return new JsonBuildingCatalog(
      buildings,
      arts,
      parseFile(directory, fiefFile, FiefContentSchema),
    )
  }

  levelOf(building: BuildingKind, level: number): BuildingLevel | undefined {
    return this.levels.get(JsonBuildingCatalog.keyOf(building, level))
  }

  artLevelOf(art: ArtKind, level: number): ArtLevel | undefined {
    return this.artLevels.get(JsonBuildingCatalog.keyOf(art, level))
  }

  fiefSettings(): FiefSettings {
    return this.settings
  }

  private static keyOf(kind: BuildingKind | ArtKind, level: number): string {
    return `${kind}:${level}`
  }
}
