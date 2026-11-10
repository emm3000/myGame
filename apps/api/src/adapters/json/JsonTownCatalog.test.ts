import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { type BuildingKind, Instant } from '@mygame/domain'
import { describe, expect, it } from 'vitest'
import { JsonTownCatalog } from './JsonTownCatalog'

const shippedTownContent = fileURLToPath(new URL('../../../content/town/', import.meta.url))

const shippedCatalog = (): JsonTownCatalog => JsonTownCatalog.fromDirectory(shippedTownContent)

const everyBuilding: ReadonlyArray<BuildingKind> = [
  'homes',
  'farm',
  'factory',
  'powerStation',
  'storage',
  'school',
  'office',
]

const withTownContent = (arrange: (directory: string) => void): string => {
  const directory = mkdtempSync(join(tmpdir(), 'mygame-town-content-'))
  cpSync(shippedTownContent, directory, { recursive: true })
  arrange(directory)
  return directory
}

const rewritten =
  (file: string, change: (content: Record<string, unknown>) => unknown) =>
  (directory: string): void => {
    const content = JSON.parse(readFileSync(join(directory, file), 'utf8'))
    writeFileSync(join(directory, file), JSON.stringify(change(content)))
  }

const startingUpOn =
  (directory: string): (() => JsonTownCatalog) =>
  () => {
    try {
      return JsonTownCatalog.fromDirectory(directory)
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  }

describe('JsonTownCatalog', () => {
  it('reads ten levels of each of the seven buildings from the shipped content', () => {
    const catalog = shippedCatalog()

    expect(
      everyBuilding.map((building) => [
        catalog.levelOf(building, 10)?.building,
        catalog.levelOf(building, 11),
      ]),
    ).toEqual(everyBuilding.map((building) => [building, undefined]))
  })

  it('reads a producer level as its rate and a storage level as its capacity', () => {
    const catalog = shippedCatalog()

    expect([catalog.levelOf('farm', 1), catalog.levelOf('storage', 2)]).toEqual([
      {
        building: 'farm',
        level: 1,
        cost: { money: 50, food: 0, power: 0, material: 70 },
        durationSeconds: 120,
        people: 1,
        ratePerHour: 25,
      },
      {
        building: 'storage',
        level: 2,
        cost: { money: 150, food: 0, power: 30, material: 225 },
        durationSeconds: 288,
        people: 2,
        capacityUnits: 2250,
      },
    ])
  })

  it('costs the homes the money of the level below in food, from level 2', () => {
    const catalog = shippedCatalog()
    const levels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

    expect(levels.map((level) => catalog.levelOf('homes', level)?.cost.food)).toEqual([
      0, 60, 90, 135, 202, 304, 456, 683, 1025, 1538,
    ])
  })

  it('reads the hires of an office level and the terms of a school level', () => {
    const catalog = shippedCatalog()

    expect([catalog.levelOf('office', 3), catalog.levelOf('school', 1)]).toMatchObject([
      { hires: ['worker', 'truck'] },
      { lessonPercent: 100, learningCap: 15 },
    ])
  })

  it('hands the domain the season epoch as an instant and a percent for fall', () => {
    const { seasons } = shippedCatalog().townSettings()

    expect([seasons.epoch, seasons.productionPercent.fall]).toEqual([
      Instant.fromEpochMilliseconds(Date.parse('2026-10-05T00:00:00Z')),
      { money: 100, food: 100, power: 100, material: 100 },
    ])
  })

  it('fails at start-up on a building file that describes another building', () => {
    const directory = withTownContent(
      rewritten('farm.json', (farm) => ({ ...farm, building: 'factory' })),
    )

    expect(startingUpOn(directory)).toThrow(/farm\.json describes factory/)
  })

  it('fails at start-up on malformed settings', () => {
    const directory = withTownContent(
      rewritten('town.json', (town) => ({ ...town, sitesPerArea: 0 })),
    )

    expect(startingUpOn(directory)).toThrow(/town\.json is malformed/)
  })
})
