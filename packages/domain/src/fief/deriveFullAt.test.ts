import { assert, describe, expect, it } from 'vitest'
import type { BuildingCatalog, FiefSettings } from '../ports/BuildingCatalog'
import { neutralSeasons } from '../testing/neutralSeasons'
import { plainCamps } from '../testing/plainCamps'
import { plainForage } from '../testing/plainForage'
import { plainUnits } from '../testing/plainUnits'
import { Instant } from '../time/Instant'
import { deriveFullAt } from './deriveFullAt'
import { Fief, type Stocks } from './Fief'
import { materializeStocks } from './materializeStocks'

const MILLISECONDS_PER_HOUR = 3_600_000

const HOURS_PER_SEASON = 7 * 24

const storedInstant = Instant.fromEpochMilliseconds(86_400_000)

const hoursAfter = (instant: Instant, hours: number): Instant =>
  Instant.fromEpochMilliseconds(instant.epochMilliseconds + hours * MILLISECONDS_PER_HOUR)

const fiefSettings: FiefSettings = {
  startingStocks: { wood: 0, stone: 0, iron: 0, gold: 0, food: 0 },
  startingCapacity: 1000,
  basePeasantSupply: 4,
  plotsPerProvince: 15,
  baseRates: { wood: 10, stone: 10, iron: 5, gold: 0, food: 10 },
  terrainBonus: {
    lowlands: { resource: 'food', ratePerHour: 10 },
    uplands: { resource: 'stone', ratePerHour: 10 },
    ridges: { resource: 'iron', ratePerHour: 10 },
  },
  buildQueueCap: 4,
  fiefCap: 2,
  units: plainUnits,
  forage: plainForage,
  camps: plainCamps,
  seasons: neutralSeasons,
}

const catalogOver = (settings: FiefSettings): BuildingCatalog => ({
  levelOf: () => undefined,
  artLevelOf: () => undefined,
  fiefSettings: () => settings,
})

const neutralCatalog = catalogOver(fiefSettings)

const neutralPercents = { wood: 100, stone: 100, iron: 100, gold: 100, food: 100 }

const epochInstant = Instant.fromEpochMilliseconds(1_791_158_400_000)

const woodDoublingSummerCatalog = catalogOver({
  ...fiefSettings,
  seasons: {
    ...neutralSeasons,
    epoch: epochInstant,
    multiplierPercent: {
      spring: neutralPercents,
      summer: { ...neutralPercents, wood: 200 },
      autumn: neutralPercents,
      winter: neutralPercents,
    },
  },
})

const fiefStoredWith = (stocks: Partial<Stocks>, storedAt: Instant): Fief => {
  const restored = Fief.restore({
    id: 'fief-1',
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
  })
  assert(restored.ok)
  return restored.value
}

describe('deriveFullAt', () => {
  it('answers when a store fills at the rate in force', () => {
    const fief = fiefStoredWith({ wood: 400 }, storedInstant)

    const fullAt = deriveFullAt(fief, neutralCatalog)

    assert(fullAt.ok)
    expect(fullAt.value.wood).toEqual(hoursAfter(storedInstant, 60))
  })

  it('fills across a season boundary at the next season rate', () => {
    const summerStart = hoursAfter(epochInstant, HOURS_PER_SEASON)
    const fief = fiefStoredWith({ wood: 800 }, hoursAfter(summerStart, -10))

    const fullAt = deriveFullAt(fief, woodDoublingSummerCatalog)

    assert(fullAt.ok)
    expect(fullAt.value.wood).toEqual(hoursAfter(summerStart, 5))
  })

  it('answers the first instant the stocks read the capacity', () => {
    const summerStart = hoursAfter(epochInstant, HOURS_PER_SEASON)
    const fief = fiefStoredWith({ wood: 333 }, hoursAfter(summerStart, -10))

    const fullAt = deriveFullAt(fief, woodDoublingSummerCatalog)

    assert(fullAt.ok)
    const filledAt = fullAt.value.wood
    assert(filledAt !== null)
    const atFill = materializeStocks(fief, woodDoublingSummerCatalog, filledAt)
    const justBefore = materializeStocks(
      fief,
      woodDoublingSummerCatalog,
      Instant.fromEpochMilliseconds(filledAt.epochMilliseconds - 1),
    )
    assert(atFill.ok && justBefore.ok)
    expect([justBefore.value.wood, atFill.value.wood]).toEqual([999, 1000])
  })

  it('answers the stored instant for a store already full', () => {
    const fief = fiefStoredWith({ stone: 1000 }, storedInstant)

    const fullAt = deriveFullAt(fief, neutralCatalog)

    assert(fullAt.ok)
    expect(fullAt.value.stone).toEqual(storedInstant)
  })

  it('answers the full-since a store already full holds', () => {
    const filledEarlier = hoursAfter(storedInstant, -5)
    const fief = fiefStoredWith({ stone: 1000 }, storedInstant).withFullSince({
      wood: null,
      stone: filledEarlier,
      iron: null,
      gold: null,
      food: null,
    })

    const fullAt = deriveFullAt(fief, neutralCatalog)

    assert(fullAt.ok)
    expect(fullAt.value.stone).toEqual(filledEarlier)
  })

  it('answers no instant for a rate of 0', () => {
    const fief = fiefStoredWith({ gold: 10 }, storedInstant)

    const fullAt = deriveFullAt(fief, neutralCatalog)

    assert(fullAt.ok)
    expect(fullAt.value.gold).toBeNull()
  })
})
