import { describe, expect, it } from 'vitest'
import type { BuildingCatalog, FarmLevel, FiefSettings } from '../ports/BuildingCatalog'
import { deriveSuppliedPeasants } from './deriveSuppliedPeasants'

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

const farmLevelOne: FarmLevel = {
  building: 'farm',
  level: 1,
  cost: { wood: 0, stone: 0, iron: 0, gold: 0, food: 0 },
  durationSeconds: 90,
  peasantOccupancy: 1,
  ratePerHour: 20,
  peasantSupply: 4,
}

const inMemoryCatalog = (levels: Partial<Record<string, FarmLevel>>): BuildingCatalog => ({
  levelOf: (building, level) => levels[`${building}:${level}`],
  fiefSettings: () => fiefSettings,
})

describe('deriveSuppliedPeasants', () => {
  it('adds the farm level peasant supply to the fief base', () => {
    const catalog = inMemoryCatalog({ 'farm:1': farmLevelOne })

    const result = deriveSuppliedPeasants(1, catalog)

    expect(result).toEqual({ ok: true, value: 10 })
  })

  it('supplies only the fief base with no farm built', () => {
    const catalog = inMemoryCatalog({})

    const result = deriveSuppliedPeasants(0, catalog)

    expect(result).toEqual({ ok: true, value: 6 })
  })

  it('refuses a farm level the catalog does not know', () => {
    const catalog = inMemoryCatalog({})

    const result = deriveSuppliedPeasants(2, catalog)

    expect(result).toEqual({
      ok: false,
      error: { kind: 'UnknownBuildingLevel', building: 'farm', level: 2 },
    })
  })
})
