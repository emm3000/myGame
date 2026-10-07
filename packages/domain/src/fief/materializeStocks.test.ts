import { assert, describe, expect, it } from 'vitest'
import type { ArtLevel, BuildingCatalog, FiefSettings } from '../ports/BuildingCatalog'
import { neutralSeasons } from '../testing/neutralSeasons'
import { plainCamps } from '../testing/plainCamps'
import { plainForage } from '../testing/plainForage'
import { plainUnits } from '../testing/plainUnits'
import { Instant } from '../time/Instant'
import { Fief, type Stocks } from './Fief'
import { noStoreFull } from './FullSince'
import { materializeStocks } from './materializeStocks'

const MILLISECONDS_PER_HOUR = 3_600_000

const storedInstant = Instant.fromEpochMilliseconds(86_400_000)

const hoursLater = (hours: number): Instant =>
  Instant.fromEpochMilliseconds(storedInstant.epochMilliseconds + hours * MILLISECONDS_PER_HOUR)

const fiefSettings: FiefSettings = {
  startingStocks: { wood: 0, stone: 0, iron: 0, gold: 0, food: 0 },
  startingCapacity: 1000,
  basePeasantSupply: 4,
  plotsPerProvince: 15,
  baseRates: { wood: 10, stone: 10, iron: 5, gold: 2, food: 10 },
  terrainBonus: {
    lowlands: { resource: 'food', ratePerHour: 10 },
    uplands: { resource: 'stone', ratePerHour: 10 },
    ridges: { resource: 'iron', ratePerHour: 10 },
  },
  buildQueueCap: 4,
  goals: [],
  fiefCap: 2,
  units: plainUnits,
  forage: plainForage,
  camps: plainCamps,
  seasons: neutralSeasons,
}

const doublingSmithing: ArtLevel = {
  art: 'smithing',
  level: 1,
  cost: { wood: 0, stone: 0, iron: 100, gold: 50, food: 0 },
  durationSeconds: 600,
  requiredLibraryLevel: 1,
  resource: 'iron',
  ratePercent: 100,
}

const smithingCatalog = (baseIronRate: number, smithing: ArtLevel): BuildingCatalog => ({
  levelOf: () => undefined,
  artLevelOf: (art, level) => (art === 'smithing' && level === 1 ? smithing : undefined),
  fiefSettings: () => ({
    ...fiefSettings,
    baseRates: { ...fiefSettings.baseRates, iron: baseIronRate },
  }),
})

const smithingFief = (): Fief => {
  const restored = Fief.restore({
    id: 'fief-1',
    playerId: 'founder',
    name: 'Vado Viejo',
    address: { kingdom: 1, province: 1, plot: 7 },
    stocks: { wood: 0, stone: 0, iron: 20, gold: 0, food: 0 },
    storedAt: storedInstant,
    buildingLevels: {
      sawmill: 0,
      quarry: 0,
      ironMine: 0,
      farm: 0,
      warehouse: 0,
      library: 0,
      barracks: 0,
    },
    artLevels: { smithing: 1, masonry: 0 },
    units: { infantry: 0, cavalry: 0, archer: 0, settler: 0 },
    slot: { kind: 'idle' },
    buildQueue: [],
    studySlot: { kind: 'idle' },
    recruitOrder: { kind: 'idle' },
    march: { kind: 'idle' },
    fullSince: noStoreFull,
    guidanceDismissedAt: null,
  })
  assert(restored.ok)
  return restored.value
}

const epochInstant = Instant.fromEpochMilliseconds(1_791_158_400_000)

const hoursFromEpoch = (hours: number): Instant =>
  Instant.fromEpochMilliseconds(epochInstant.epochMilliseconds + hours * MILLISECONDS_PER_HOUR)

const neutralPercents = { wood: 100, stone: 100, iron: 100, gold: 100, food: 100 }

const seasonalCatalog: BuildingCatalog = {
  levelOf: () => undefined,
  artLevelOf: () => undefined,
  fiefSettings: () => ({
    ...fiefSettings,
    startingCapacity: 100_000,
    baseRates: { ...fiefSettings.baseRates, food: 5 },
    seasons: {
      epoch: epochInstant,
      daysPerSeason: 7,
      multiplierPercent: {
        spring: { ...neutralPercents, food: 125 },
        summer: neutralPercents,
        autumn: { ...neutralPercents, gold: 125 },
        winter: { ...neutralPercents, food: 75 },
      },
      durationPercent: neutralSeasons.durationPercent,
    },
  }),
}

const seasonalFief = (stocks: Partial<Stocks>, storedAt: Instant): Fief => {
  const restored = Fief.restore({
    id: 'fief-2',
    playerId: 'founder',
    name: 'Vado Viejo',
    address: { kingdom: 1, province: 1, plot: 7 },
    stocks: { wood: 0, stone: 0, iron: 0, gold: 0, food: 0, ...stocks },
    storedAt,
    buildingLevels: {
      sawmill: 0,
      quarry: 0,
      ironMine: 0,
      farm: 0,
      warehouse: 0,
      library: 0,
      barracks: 0,
    },
    artLevels: { smithing: 0, masonry: 0 },
    units: { infantry: 0, cavalry: 0, archer: 0, settler: 0 },
    slot: { kind: 'idle' },
    buildQueue: [],
    studySlot: { kind: 'idle' },
    recruitOrder: { kind: 'idle' },
    march: { kind: 'idle' },
    fullSince: noStoreFull,
    guidanceDismissedAt: null,
  })
  assert(restored.ok)
  return restored.value
}

describe('materializeStocks', () => {
  it('accrues iron at the rate the smithing level of the fief raises', () => {
    const catalog = smithingCatalog(5, doublingSmithing)

    const stocks = materializeStocks(smithingFief(), catalog, hoursLater(2))

    assert(stocks.ok)
    expect(stocks.value.iron).toBe(40)
  })

  it('accrues the whole raised rate when the percent has no exact binary fraction', () => {
    const catalog = smithingCatalog(200, { ...doublingSmithing, ratePercent: 15 })

    const stocks = materializeStocks(smithingFief(), catalog, hoursLater(1))

    assert(stocks.ok)
    expect(stocks.value.iron).toBe(250)
  })

  it('accrues across the epoch at the neutral rate then the spring rate', () => {
    const stocks = materializeStocks(
      seasonalFief({ food: 300 }, hoursFromEpoch(-2)),
      seasonalCatalog,
      hoursFromEpoch(2),
    )

    assert(stocks.ok)
    expect(stocks.value.food).toBe(367)
  })

  it('accrues each season of a long absence at its own rates', () => {
    const stocks = materializeStocks(
      seasonalFief({}, hoursFromEpoch(6 * 24)),
      seasonalCatalog,
      hoursFromEpoch(21 * 24 + 12),
    )

    assert(stocks.ok)
    expect(stocks.value.food).toBe(5625)
    expect(stocks.value.gold).toBe(828)
  })

  it('accrues from winter into the spring of the next year', () => {
    const stocks = materializeStocks(
      seasonalFief({}, hoursFromEpoch(27 * 24)),
      seasonalCatalog,
      hoursFromEpoch(28 * 24 + 4),
    )

    assert(stocks.ok)
    expect(stocks.value.food).toBe(345)
  })

  it('floors each season segment on its own', () => {
    const stocks = materializeStocks(
      seasonalFief({}, hoursFromEpoch(7 * 24 - 1)),
      seasonalCatalog,
      hoursFromEpoch(7 * 24 + 0.5),
    )

    assert(stocks.ok)
    expect(stocks.value.food).toBe(25)
  })

  it('keeps a stock above the capacity frozen across a season change', () => {
    const cappedCatalog: BuildingCatalog = {
      ...seasonalCatalog,
      fiefSettings: () => ({ ...seasonalCatalog.fiefSettings(), startingCapacity: 1000 }),
    }

    const stocks = materializeStocks(
      seasonalFief({ food: 1200, wood: 985 }, hoursFromEpoch(-1)),
      cappedCatalog,
      hoursFromEpoch(3),
    )

    assert(stocks.ok)
    expect(stocks.value.food).toBe(1200)
    expect(stocks.value.wood).toBe(1000)
  })
})
