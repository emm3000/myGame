import { describe, expect, it } from 'vitest'
import type { BuildingCatalog, FiefSettings, WarehouseLevel } from '../ports/BuildingCatalog'
import { deriveWarehouseCapacity } from './deriveWarehouseCapacity'

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
}

const warehouseLevelTwo: WarehouseLevel = {
  building: 'warehouse',
  level: 2,
  cost: { wood: 0, stone: 0, iron: 0, gold: 0, food: 0 },
  durationSeconds: 120,
  peasantOccupancy: 2,
  capacityUnits: 4000,
}

const inMemoryCatalog = (levels: Partial<Record<string, WarehouseLevel>>): BuildingCatalog => ({
  levelOf: (building, level) => levels[`${building}:${level}`],
  fiefSettings: () => fiefSettings,
})

describe('deriveWarehouseCapacity', () => {
  it('sets the capacity from the warehouse level', () => {
    const catalog = inMemoryCatalog({ 'warehouse:2': warehouseLevelTwo })

    const result = deriveWarehouseCapacity(2, catalog)

    expect(result).toEqual({ ok: true, value: 4000 })
  })

  it('uses the starting capacity when no warehouse is built', () => {
    const catalog = inMemoryCatalog({})

    const result = deriveWarehouseCapacity(0, catalog)

    expect(result).toEqual({ ok: true, value: 900 })
  })

  it('refuses a warehouse level the catalog does not know', () => {
    const catalog = inMemoryCatalog({})

    const result = deriveWarehouseCapacity(3, catalog)

    expect(result).toEqual({
      ok: false,
      error: { kind: 'UnknownBuildingLevel', building: 'warehouse', level: 3 },
    })
  })
})
