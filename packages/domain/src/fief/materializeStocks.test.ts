import { assert, describe, expect, it } from 'vitest'
import type { ArtLevel, BuildingCatalog, FiefSettings } from '../ports/BuildingCatalog'
import { Instant } from '../time/Instant'
import { Fief } from './Fief'
import { materializeStocks } from './materializeStocks'

const MILLISECONDS_PER_HOUR = 3_600_000

const storedInstant = Instant.fromEpochMilliseconds(86_400_000)

const twoHoursLater = Instant.fromEpochMilliseconds(
  storedInstant.epochMilliseconds + 2 * MILLISECONDS_PER_HOUR,
)

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

const smithingCatalog: BuildingCatalog = {
  levelOf: () => undefined,
  artLevelOf: (art, level) => (art === 'smithing' && level === 1 ? doublingSmithing : undefined),
  fiefSettings: () => fiefSettings,
}

const smithingFief = (): Fief => {
  const restored = Fief.restore({
    id: 'fief-1',
    playerId: 'founder',
    name: 'Vado Viejo',
    address: { kingdom: 1, province: 1, plot: 7 },
    stocks: { wood: 0, stone: 0, iron: 20, gold: 0, food: 0 },
    storedAt: storedInstant,
    buildingLevels: { sawmill: 0, quarry: 0, ironMine: 0, farm: 0, warehouse: 0 },
    artLevels: { smithing: 1, masonry: 0 },
    slot: { kind: 'idle' },
    buildQueue: [],
  })
  assert(restored.ok)
  return restored.value
}

describe('materializeStocks', () => {
  it('accrues iron at the rate the smithing level of the fief raises', () => {
    const stocks = materializeStocks(smithingFief(), smithingCatalog, twoHoursLater)

    assert(stocks.ok)
    expect(stocks.value.iron).toBe(40)
  })
})
