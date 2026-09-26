import { describe, expect, it } from 'vitest'
import type {
  BuildingCatalog,
  BuildingLevel,
  FarmLevel,
  FiefSettings,
  ProducerLevel,
} from '../ports/BuildingCatalog'
import { derivePeasantCounts } from './derivePeasantCounts'
import type { FiefBuildingLevels } from './FiefBuildingLevels'

const fiefSettings: FiefSettings = {
  startingStocks: { wood: 0, stone: 0, iron: 0, gold: 0, food: 0 },
  startingCapacity: 900,
  basePeasantSupply: 6,
  plotsPerProvince: 15,
  baseRates: { wood: 10, stone: 10, iron: 5, gold: 2, food: 10 },
  terrainBonus: {
    lowlands: { resource: 'food', ratePerHour: 10 },
    uplands: { resource: 'stone', ratePerHour: 10 },
    ridges: { resource: 'iron', ratePerHour: 10 },
  },
  buildQueueCap: 4,
}

const farmLevel = (level: number, peasantOccupancy: number, peasantSupply: number): FarmLevel => ({
  building: 'farm',
  level,
  cost: { wood: 0, stone: 0, iron: 0, gold: 0, food: 0 },
  durationSeconds: 90,
  peasantOccupancy,
  ratePerHour: 20,
  peasantSupply,
})

const sawmillLevel = (level: number, peasantOccupancy: number): ProducerLevel => ({
  building: 'sawmill',
  level,
  cost: { wood: 0, stone: 0, iron: 0, gold: 0, food: 0 },
  durationSeconds: 60,
  peasantOccupancy,
  ratePerHour: 10,
})

const inMemoryCatalog = (levels: ReadonlyArray<BuildingLevel>): BuildingCatalog => ({
  levelOf: (building, level) =>
    levels.find((found) => found.building === building && found.level === level),
  fiefSettings: () => fiefSettings,
})

const catalog = inMemoryCatalog([
  farmLevel(1, 1, 4),
  farmLevel(2, 2, 9),
  sawmillLevel(1, 1),
  sawmillLevel(2, 20),
])

const levelsWith = (levels: Partial<FiefBuildingLevels>): FiefBuildingLevels => ({
  sawmill: 0,
  quarry: 0,
  ironMine: 0,
  farm: 0,
  warehouse: 0,
  ...levels,
})

describe('derivePeasantCounts', () => {
  it('counts supplied, occupied and free peasants at the levels a queued farm projects', () => {
    const projectedWithQueuedFarm = levelsWith({ sawmill: 1, farm: 2 })

    const result = derivePeasantCounts(projectedWithQueuedFarm, catalog)

    expect(result).toEqual({ ok: true, value: { supplied: 15, occupied: 3, free: 12 } })
  })

  it('refuses levels that occupy more peasants than they supply', () => {
    const overcrowded = levelsWith({ sawmill: 2 })

    const result = derivePeasantCounts(overcrowded, catalog)

    expect(result).toEqual({
      ok: false,
      error: { kind: 'NegativeFreePeasants', suppliedPeasants: 6, occupiedPeasants: 20 },
    })
  })
})
