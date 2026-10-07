import { assert, describe, expect, it } from 'vitest'
import type { BuildingCatalog, FiefSettings } from '../ports/BuildingCatalog'
import { neutralSeasons } from '../testing/neutralSeasons'
import { plainCamps } from '../testing/plainCamps'
import { plainForage } from '../testing/plainForage'
import { plainUnits } from '../testing/plainUnits'
import { Instant } from '../time/Instant'
import { Fief, type Stocks } from './Fief'
import { noStoreFull } from './FullSince'
import { fullStoresOf } from './fullStoresOf'

const fiefSettings: FiefSettings = {
  startingStocks: { wood: 0, stone: 0, iron: 0, gold: 0, food: 0 },
  startingCapacity: 900,
  basePeasantSupply: 4,
  plotsPerProvince: 15,
  baseRates: { wood: 10, stone: 10, iron: 5, gold: 0, food: 10 },
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

const catalog: BuildingCatalog = {
  levelOf: () => undefined,
  artLevelOf: () => undefined,
  fiefSettings: () => fiefSettings,
}

const fiefStoredWith = (stocks: Partial<Stocks>): Fief => {
  const restored = Fief.restore({
    id: 'fief-1',
    playerId: 'founder',
    name: 'Vado Viejo',
    address: { kingdom: 1, province: 1, plot: 7 },
    stocks: { wood: 0, stone: 0, iron: 0, gold: 0, food: 0, ...stocks },
    storedAt: Instant.fromEpochMilliseconds(86_400_000),
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

describe('fullStoresOf', () => {
  it('reads a store at exactly its capacity as full', () => {
    const fief = fiefStoredWith({ stone: 900 })

    expect(fullStoresOf(fief, catalog)).toEqual({ ok: true, value: ['stone'] })
  })

  it('reads a store one unit under its capacity as not full', () => {
    const fief = fiefStoredWith({ wood: 899 })

    expect(fullStoresOf(fief, catalog)).toEqual({ ok: true, value: [] })
  })
})
