import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { ArtContent, BuildingContent, FiefContent } from '@mygame/contracts'
import { type ArtKind, type ArtLevel, type BuildingLevel, Instant } from '@mygame/domain'
import { describe, expect, it } from 'vitest'
import { JsonBuildingCatalog } from './JsonBuildingCatalog'

const shippedContent = fileURLToPath(new URL('../../../content/', import.meta.url))

const levelOne = {
  level: 1,
  cost: { wood: 10, stone: 5, iron: 0, gold: 0, food: 0 },
  durationSeconds: 60,
  peasantOccupancy: 1,
}

const oneLevelBuildings: ReadonlyArray<BuildingContent> = [
  { building: 'sawmill', levels: [{ ...levelOne, effect: { ratePerHour: 30 } }] },
  { building: 'quarry', levels: [{ ...levelOne, effect: { ratePerHour: 20 } }] },
  { building: 'ironMine', levels: [{ ...levelOne, effect: { ratePerHour: 10 } }] },
  { building: 'farm', levels: [{ ...levelOne, effect: { ratePerHour: 25, peasantSupply: 5 } }] },
  { building: 'warehouse', levels: [{ ...levelOne, effect: { capacity: 1500 } }] },
  { building: 'library', levels: [{ ...levelOne, peasantOccupancy: 2 }] },
]

const plainFief: FiefContent = {
  startingStocks: { wood: 500, stone: 500, iron: 200, gold: 50, food: 300 },
  startingCapacity: 1000,
  basePeasantSupply: 10,
  plotsPerProvince: 15,
  baseRates: { wood: 10, stone: 10, iron: 5, gold: 2, food: 10 },
  terrainBonus: {
    lowlands: { resource: 'food', ratePerHour: 5 },
    uplands: { resource: 'stone', ratePerHour: 4 },
    ridges: { resource: 'iron', ratePerHour: 2 },
  },
  buildQueueCap: 4,
  seasons: {
    epoch: '2026-10-05T00:00:00Z',
    daysPerSeason: 7,
    multiplierPercent: {
      spring: { wood: 100, stone: 100, iron: 100, gold: 100, food: 125 },
      summer: { wood: 100, stone: 100, iron: 100, gold: 100, food: 100 },
      autumn: { wood: 100, stone: 100, iron: 100, gold: 125, food: 100 },
      winter: { wood: 100, stone: 100, iron: 100, gold: 100, food: 75 },
    },
    durationPercent: {
      spring: { build: 100, study: 100 },
      summer: { build: 100, study: 100 },
      autumn: { build: 100, study: 100 },
      winter: { build: 100, study: 100 },
    },
  },
}

const oneLevelArts: ReadonlyArray<ArtContent> = [
  {
    art: 'smithing',
    resource: 'iron',
    levels: [
      {
        level: 1,
        cost: { wood: 120, stone: 80, iron: 150, gold: 60, food: 0 },
        durationSeconds: 1800,
        requiredLibraryLevel: 1,
        effect: { ratePercent: 5 },
      },
    ],
  },
  {
    art: 'masonry',
    resource: 'stone',
    levels: [
      {
        level: 1,
        cost: { wood: 150, stone: 150, iron: 60, gold: 60, food: 0 },
        durationSeconds: 1800,
        requiredLibraryLevel: 1,
        effect: { ratePercent: 8 },
      },
    ],
  },
]

const oneLevelCatalog = (): JsonBuildingCatalog =>
  new JsonBuildingCatalog(oneLevelBuildings, oneLevelArts, plainFief)

const shippedArtLevels = (art: ArtKind): ReadonlyArray<ArtLevel | undefined> => {
  const catalog = JsonBuildingCatalog.fromDirectory(shippedContent)
  return Array.from({ length: 10 }, (_, index) => catalog.artLevelOf(art, index + 1))
}

const shippedLibraryLevels = (): ReadonlyArray<BuildingLevel | undefined> => {
  const catalog = JsonBuildingCatalog.fromDirectory(shippedContent)
  return Array.from({ length: 10 }, (_, index) => catalog.levelOf('library', index + 1))
}

const strictlyRises = (values: ReadonlyArray<number>): boolean =>
  values.every((value, index) => index === 0 || value > (values[index - 1] ?? 0))

const shippedRequirements = (): ReadonlyArray<ReadonlyArray<number>> =>
  (['smithing', 'masonry'] as const).map((art) =>
    shippedArtLevels(art).map((line) => line?.requiredLibraryLevel ?? 0),
  )

const withContentDirectory = (arrange: (directory: string) => void): string => {
  const directory = mkdtempSync(join(tmpdir(), 'mygame-content-'))
  cpSync(shippedContent, directory, { recursive: true })
  arrange(directory)
  return directory
}

const startingUpOn =
  (directory: string): (() => JsonBuildingCatalog) =>
  () => {
    try {
      return JsonBuildingCatalog.fromDirectory(directory)
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  }

describe('JsonBuildingCatalog', () => {
  it('reports a level the building does not list as undefined', () => {
    expect(oneLevelCatalog().levelOf('sawmill', 2)).toBeUndefined()
  })

  it('reads the iron mine by its camelCase wire id', () => {
    expect(oneLevelCatalog().levelOf('ironMine', 1)).toMatchObject({
      building: 'ironMine',
      ratePerHour: 10,
    })
  })

  it('reads a farm level as a food rate plus a peasant supply', () => {
    expect(oneLevelCatalog().levelOf('farm', 1)).toMatchObject({
      building: 'farm',
      ratePerHour: 25,
      peasantSupply: 5,
    })
  })

  it('reads a warehouse level capacity as capacity units', () => {
    expect(oneLevelCatalog().levelOf('warehouse', 1)).toMatchObject({
      building: 'warehouse',
      capacityUnits: 1500,
    })
  })

  it('reads a library level as its cost, duration and occupancy alone', () => {
    expect(oneLevelCatalog().levelOf('library', 1)).toEqual({
      building: 'library',
      ...levelOne,
      peasantOccupancy: 2,
    })
  })

  it('ships the library at levels 1 to 10', () => {
    expect(shippedLibraryLevels().map((line) => `${line?.building}:${line?.level}`)).toEqual(
      Array.from({ length: 10 }, (_, index) => `library:${index + 1}`),
    )
  })

  it('ships library levels whose total cost strictly rises', () => {
    const totals = shippedLibraryLevels().map((line) =>
      Object.values(line?.cost ?? {}).reduce((total, amount) => total + amount, 0),
    )

    expect(strictlyRises(totals)).toBe(true)
  })

  it('ships library levels whose duration strictly rises', () => {
    expect(strictlyRises(shippedLibraryLevels().map((line) => line?.durationSeconds ?? 0))).toBe(
      true,
    )
  })

  it('serves the plots per province of the fief content', () => {
    expect(oneLevelCatalog().fiefSettings().plotsPerProvince).toBe(15)
  })

  it('serves the terrain bonus of the fief content', () => {
    expect(oneLevelCatalog().fiefSettings().terrainBonus.uplands).toEqual({
      resource: 'stone',
      ratePerHour: 4,
    })
  })

  it('serves the build queue cap of the fief content', () => {
    expect(oneLevelCatalog().fiefSettings().buildQueueCap).toBe(4)
  })

  it('serves a build queue cap of four from the shipped content', () => {
    expect(JsonBuildingCatalog.fromDirectory(shippedContent).fiefSettings().buildQueueCap).toBe(4)
  })

  it('reads a smithing level as an iron percent with its library requirement', () => {
    expect(oneLevelCatalog().artLevelOf('smithing', 1)).toEqual({
      art: 'smithing',
      level: 1,
      cost: { wood: 120, stone: 80, iron: 150, gold: 60, food: 0 },
      durationSeconds: 1800,
      requiredLibraryLevel: 1,
      resource: 'iron',
      ratePercent: 5,
    })
  })

  it('reports an art level the art does not list as undefined', () => {
    expect(oneLevelCatalog().artLevelOf('masonry', 2)).toBeUndefined()
  })

  it('fails at start-up on an art file that names the other art', () => {
    const directory = withContentDirectory((copy) => {
      const smithing = readFileSync(join(copy, 'arts', 'smithing.json'), 'utf8')
      writeFileSync(join(copy, 'arts', 'masonry.json'), smithing)
    })

    expect(startingUpOn(directory)).toThrow(/masonry\.json describes smithing/)
  })

  it('fails at start-up on a malformed art file', () => {
    const directory = withContentDirectory((copy) => {
      writeFileSync(join(copy, 'arts', 'smithing.json'), '{ "art": "smithing" }')
    })

    expect(startingUpOn(directory)).toThrow(/smithing\.json is malformed/)
  })

  it('ships smithing raising iron at levels 1 to 10', () => {
    expect(shippedArtLevels('smithing').map((line) => `${line?.resource}:${line?.level}`)).toEqual(
      Array.from({ length: 10 }, (_, index) => `iron:${index + 1}`),
    )
  })

  it('ships masonry raising stone at levels 1 to 10', () => {
    expect(shippedArtLevels('masonry').map((line) => `${line?.resource}:${line?.level}`)).toEqual(
      Array.from({ length: 10 }, (_, index) => `stone:${index + 1}`),
    )
  })

  it('ships level 1 of every art requiring library level 1', () => {
    expect(shippedRequirements().map((requirements) => requirements[0])).toEqual([1, 1])
  })

  it('ships library requirements that never decrease from one art level to the next', () => {
    expect(
      shippedRequirements().map((requirements) =>
        requirements.every((required, index) => required >= (requirements[index - 1] ?? 1)),
      ),
    ).toEqual([true, true])
  })

  it('ships library requirements that never pass level 10', () => {
    expect(
      shippedRequirements()
        .flat()
        .every((required) => required <= 10),
    ).toBe(true)
  })

  it('ships a percent that strictly rises with every art level', () => {
    const percentsOf = (art: ArtKind): ReadonlyArray<number> =>
      shippedArtLevels(art).map((line) => line?.ratePercent ?? 0)

    expect(
      [percentsOf('smithing'), percentsOf('masonry')].map((percents) =>
        percents.every((percent, index) => index === 0 || percent > (percents[index - 1] ?? 0)),
      ),
    ).toEqual([true, true])
  })

  it('ships art levels that each cost gold', () => {
    const golds = [...shippedArtLevels('smithing'), ...shippedArtLevels('masonry')].map(
      (line) => line?.cost.gold ?? 0,
    )

    expect(golds.every((gold) => gold > 0)).toBe(true)
  })

  it('reads the season calendar from the shipped content', () => {
    const unchangedRates = { wood: 100, stone: 100, iron: 100, gold: 100, food: 100 }

    const { durationPercent: _, ...calendar } =
      JsonBuildingCatalog.fromDirectory(shippedContent).fiefSettings().seasons

    expect(calendar).toEqual({
      epoch: Instant.fromEpochMilliseconds(Date.UTC(2026, 9, 5)),
      daysPerSeason: 7,
      multiplierPercent: {
        spring: { ...unchangedRates, food: 125 },
        summer: unchangedRates,
        autumn: { ...unchangedRates, gold: 125 },
        winter: { ...unchangedRates, food: 75 },
      },
    })
  })

  it('reads the duration percents from the shipped content', () => {
    const unchangedDurations = { build: 100, study: 100 }

    expect(
      JsonBuildingCatalog.fromDirectory(shippedContent).fiefSettings().seasons.durationPercent,
    ).toEqual({
      spring: unchangedDurations,
      summer: { ...unchangedDurations, build: 75 },
      autumn: unchangedDurations,
      winter: { ...unchangedDurations, study: 75 },
    })
  })
})
