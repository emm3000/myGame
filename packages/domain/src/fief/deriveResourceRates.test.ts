import { assert, describe, expect, it } from 'vitest'
import type {
  ArtLevel,
  BuildingCatalog,
  FarmLevel,
  FiefSettings,
  ProducerLevel,
} from '../ports/BuildingCatalog'
import type { SeasonCalendar } from '../season/SeasonCalendar'
import { Instant } from '../time/Instant'
import { deriveResourceRates } from './deriveResourceRates'
import type { FiefArtLevels } from './FiefArtLevels'
import type { FiefBuildingLevels } from './FiefBuildingLevels'

const noLevels: FiefBuildingLevels = {
  sawmill: 0,
  quarry: 0,
  ironMine: 0,
  farm: 0,
  warehouse: 0,
  library: 0,
}

const noArts: FiefArtLevels = { smithing: 0, masonry: 0 }

const tollBaseRates = { wood: 10, stone: 10, iron: 5, gold: 2, food: 10 }

const MILLISECONDS_PER_DAY = 86_400_000

const epoch = Instant.fromEpochMilliseconds(1_791_158_400_000)

const daysAfterEpoch = (days: number): Instant =>
  Instant.fromEpochMilliseconds(epoch.epochMilliseconds + days * MILLISECONDS_PER_DAY)

const beforeEpoch = daysAfterEpoch(-30)

const midWinter = daysAfterEpoch(24)

const midAutumn = daysAfterEpoch(17)

const neutralPercents = { wood: 100, stone: 100, iron: 100, gold: 100, food: 100 }

const gentleSeasons: SeasonCalendar = {
  epoch,
  daysPerSeason: 7,
  multiplierPercent: {
    spring: { ...neutralPercents, food: 125 },
    summer: neutralPercents,
    autumn: { ...neutralPercents, gold: 125 },
    winter: { ...neutralPercents, food: 75 },
  },
}

const fiefSettings = (
  bonusResource: 'wood' | 'stone' | 'iron' | 'gold' | 'food',
): FiefSettings => ({
  startingStocks: { wood: 0, stone: 0, iron: 0, gold: 0, food: 0 },
  startingCapacity: 900,
  basePeasantSupply: 6,
  plotsPerProvince: 15,
  baseRates: tollBaseRates,
  terrainBonus: {
    lowlands: { resource: bonusResource, ratePerHour: 10 },
    uplands: { resource: bonusResource, ratePerHour: 10 },
    ridges: { resource: bonusResource, ratePerHour: 10 },
  },
  buildQueueCap: 4,
  seasons: gentleSeasons,
})

const producerLevel = (ratePerHour: number): ProducerLevel => ({
  building: 'sawmill',
  level: 1,
  cost: { wood: 0, stone: 0, iron: 0, gold: 0, food: 0 },
  durationSeconds: 60,
  peasantOccupancy: 1,
  ratePerHour,
})

const farmLevel = (peasantSupply: number): FarmLevel => ({
  building: 'farm',
  level: 1,
  cost: { wood: 0, stone: 0, iron: 0, gold: 0, food: 0 },
  durationSeconds: 90,
  peasantOccupancy: 1,
  ratePerHour: 20,
  peasantSupply,
})

const smithingLevel = (level: number, ratePercent: number): ArtLevel => ({
  art: 'smithing',
  level,
  cost: { wood: 0, stone: 0, iron: 100, gold: 50, food: 0 },
  durationSeconds: 600,
  requiredLibraryLevel: 1,
  resource: 'iron',
  ratePercent,
})

const inMemoryCatalog = (
  settings: FiefSettings,
  levels: Partial<Record<string, ProducerLevel | FarmLevel>>,
  arts: Partial<Record<string, ArtLevel>> = {},
): BuildingCatalog => ({
  levelOf: (building, level) => levels[`${building}:${level}`],
  artLevelOf: (art, level) => arts[`${art}:${level}`],
  fiefSettings: () => settings,
})

const smithingCatalog = (bonusResource: 'iron' | 'gold'): BuildingCatalog =>
  inMemoryCatalog(
    fiefSettings(bonusResource),
    { 'ironMine:1': { ...producerLevel(25), building: 'ironMine' } },
    { 'smithing:1': smithingLevel(1, 10), 'smithing:2': smithingLevel(2, 50) },
  )

const minedLevels: FiefBuildingLevels = { ...noLevels, ironMine: 1 }

describe('deriveResourceRates', () => {
  it('reads the wood rate from the sawmill level', () => {
    const catalog = inMemoryCatalog(fiefSettings('gold'), {
      'sawmill:2': { ...producerLevel(30), level: 2 },
    })
    const levels: FiefBuildingLevels = { ...noLevels, sawmill: 2 }

    const result = deriveResourceRates(levels, noArts, 'ridges', catalog, beforeEpoch)

    assert(result.ok)
    expect(result.value.wood).toBe(40)
  })

  it('raises the rate the terrain favours by the fief settings bonus', () => {
    const catalog = inMemoryCatalog(fiefSettings('wood'), {
      'sawmill:1': producerLevel(20),
    })
    const levels: FiefBuildingLevels = { ...noLevels, sawmill: 1 }

    const result = deriveResourceRates(levels, noArts, 'lowlands', catalog, beforeEpoch)

    assert(result.ok)
    expect(result.value.wood).toBe(40)
  })

  it('adds the base rate under the producer rate and the terrain bonus', () => {
    const catalog = inMemoryCatalog(
      { ...fiefSettings('iron'), baseRates: { ...tollBaseRates, iron: 7 } },
      { 'ironMine:1': { ...producerLevel(25), building: 'ironMine' } },
    )
    const levels: FiefBuildingLevels = { ...noLevels, ironMine: 1 }

    const result = deriveResourceRates(levels, noArts, 'ridges', catalog, beforeEpoch)

    assert(result.ok)
    expect(result.value.iron).toBe(42)
  })

  it('derives the base rate of every resource on a fief with no building', () => {
    const catalog = inMemoryCatalog(
      {
        ...fiefSettings('food'),
        terrainBonus: {
          lowlands: { resource: 'food', ratePerHour: 5 },
          uplands: { resource: 'stone', ratePerHour: 4 },
          ridges: { resource: 'iron', ratePerHour: 2 },
        },
        buildQueueCap: 4,
      },
      {},
    )

    const result = deriveResourceRates(noLevels, noArts, 'lowlands', catalog, beforeEpoch)

    expect(result).toEqual({
      ok: true,
      value: { wood: 10, stone: 10, iron: 5, gold: 2, food: 15 },
    })
  })

  it('refuses a building level the catalog does not know', () => {
    const catalog = inMemoryCatalog(fiefSettings('gold'), {})
    const levels: FiefBuildingLevels = { ...noLevels, sawmill: 5 }

    const result = deriveResourceRates(levels, noArts, 'ridges', catalog, beforeEpoch)

    expect(result).toEqual({
      ok: false,
      error: { kind: 'UnknownBuildingLevel', building: 'sawmill', level: 5 },
    })
  })

  it('refuses a catalog answer whose building does not match the one asked for', () => {
    const catalog = inMemoryCatalog(fiefSettings('gold'), { 'sawmill:1': farmLevel(4) })
    const levels: FiefBuildingLevels = { ...noLevels, sawmill: 1 }

    const result = deriveResourceRates(levels, noArts, 'ridges', catalog, beforeEpoch)

    expect(result).toEqual({
      ok: false,
      error: { kind: 'UnknownBuildingLevel', building: 'sawmill', level: 1 },
    })
  })

  it('multiplies the iron rate by the smithing percent of its level', () => {
    const arts: FiefArtLevels = { ...noArts, smithing: 2 }

    const result = deriveResourceRates(
      minedLevels,
      arts,
      'ridges',
      smithingCatalog('gold'),
      beforeEpoch,
    )

    assert(result.ok)
    expect(result.value.iron).toBe(45)
  })

  it('applies the art after the terrain bonus', () => {
    const arts: FiefArtLevels = { ...noArts, smithing: 2 }

    const result = deriveResourceRates(
      minedLevels,
      arts,
      'ridges',
      smithingCatalog('iron'),
      beforeEpoch,
    )

    assert(result.ok)
    expect(result.value.iron).toBe(60)
  })

  it('leaves every rate untouched at art level zero', () => {
    const result = deriveResourceRates(
      minedLevels,
      noArts,
      'ridges',
      smithingCatalog('gold'),
      beforeEpoch,
    )

    expect(result).toEqual({
      ok: true,
      value: { wood: 10, stone: 10, iron: 30, gold: 12, food: 10 },
    })
  })

  it('refuses an art level the catalog does not know', () => {
    const arts: FiefArtLevels = { ...noArts, smithing: 3 }

    const result = deriveResourceRates(
      minedLevels,
      arts,
      'ridges',
      smithingCatalog('gold'),
      beforeEpoch,
    )

    expect(result).toEqual({
      ok: false,
      error: { kind: 'UnknownArtLevel', art: 'smithing', level: 3 },
    })
  })

  it('refuses a catalog answer whose art does not match the one asked for', () => {
    const catalog = inMemoryCatalog(fiefSettings('gold'), {}, { 'masonry:1': smithingLevel(1, 10) })
    const arts: FiefArtLevels = { ...noArts, masonry: 1 }

    const result = deriveResourceRates(noLevels, arts, 'ridges', catalog, beforeEpoch)

    expect(result).toEqual({
      ok: false,
      error: { kind: 'UnknownArtLevel', art: 'masonry', level: 1 },
    })
  })
})

describe('deriveResourceRates in a season', () => {
  const woodlandCatalog = inMemoryCatalog(fiefSettings('wood'), {})

  it('lowers the food rate in winter', () => {
    const result = deriveResourceRates(noLevels, noArts, 'ridges', woodlandCatalog, midWinter)

    assert(result.ok)
    expect(result.value.food).toBe(7.5)
  })

  it('raises the gold rate in autumn', () => {
    const result = deriveResourceRates(noLevels, noArts, 'ridges', woodlandCatalog, midAutumn)

    assert(result.ok)
    expect(result.value.gold).toBe(2.5)
  })

  it('multiplies the terrain bonus by the season too', () => {
    const lowlandsFoodSettings: FiefSettings = {
      ...fiefSettings('food'),
      terrainBonus: {
        lowlands: { resource: 'food', ratePerHour: 5 },
        uplands: { resource: 'stone', ratePerHour: 4 },
        ridges: { resource: 'iron', ratePerHour: 2 },
      },
    }
    const catalog = inMemoryCatalog(lowlandsFoodSettings, {})

    const result = deriveResourceRates(noLevels, noArts, 'lowlands', catalog, midWinter)

    assert(result.ok)
    expect(result.value.food).toBe(11.25)
  })

  it('leaves every rate unchanged before the epoch', () => {
    const result = deriveResourceRates(noLevels, noArts, 'ridges', woodlandCatalog, beforeEpoch)

    expect(result).toEqual({
      ok: true,
      value: { wood: 20, stone: 10, iron: 5, gold: 2, food: 10 },
    })
  })
})
