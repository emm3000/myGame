import { describe, expect, it } from 'vitest'
import type { BuildingCatalog, FiefSettings, WarehouseLevel } from '../ports/BuildingCatalog'
import { deriveWarehouseCapacity } from './deriveWarehouseCapacity'

const fiefSettings: FiefSettings = {
  startingStocks: { wood: 0, stone: 0, iron: 0, gold: 0, food: 0 },
  startingCapacity: 1000,
  basePeasantSupply: 6,
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
  capacityUnits: 5000,
}

const inMemoryCatalog = (levels: Partial<Record<string, WarehouseLevel>>): BuildingCatalog => ({
  levelOf: ((building: string, level: number) =>
    levels[`${building}:${level}`]) as BuildingCatalog['levelOf'],
  fiefSettings: () => fiefSettings,
})

describe('deriveWarehouseCapacity', () => {
  it('sets the capacity from the warehouse level', () => {
    const catalog = inMemoryCatalog({ 'warehouse:2': warehouseLevelTwo })

    const result = deriveWarehouseCapacity(2, catalog)

    expect(result).toEqual({ ok: true, value: 5000 })
  })

  it('uses the starting capacity when no warehouse is built', () => {
    const catalog = inMemoryCatalog({})

    const result = deriveWarehouseCapacity(0, catalog)

    expect(result).toEqual({ ok: true, value: 1000 })
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
