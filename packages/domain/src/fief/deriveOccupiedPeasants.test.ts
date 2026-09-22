import { describe, expect, it } from 'vitest'
import type { BuildingCatalog, BuildingLevel, FiefSettings } from '../ports/BuildingCatalog'
import { deriveOccupiedPeasants } from './deriveOccupiedPeasants'
import type { FiefBuildingLevels } from './FiefBuildingLevels'

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

const level = (peasantOccupancy: number): BuildingLevel => ({
  building: 'sawmill',
  level: 1,
  cost: { wood: 0, stone: 0, iron: 0, gold: 0, food: 0 },
  durationSeconds: 60,
  peasantOccupancy,
  ratePerHour: 10,
})

const inMemoryCatalog = (levels: Partial<Record<string, BuildingLevel>>): BuildingCatalog => ({
  levelOf: ((building: string, buildingLevel: number) =>
    levels[`${building}:${buildingLevel}`]) as BuildingCatalog['levelOf'],
  fiefSettings: () => fiefSettings,
})

describe('deriveOccupiedPeasants', () => {
  it('counts the peasants every building level occupies', () => {
    const catalog = inMemoryCatalog({
      'sawmill:1': level(1),
      'quarry:1': level(2),
      'ironMine:1': level(3),
      'farm:1': level(1),
      'warehouse:1': level(2),
    })
    const levels: FiefBuildingLevels = {
      sawmill: 1,
      quarry: 1,
      ironMine: 1,
      farm: 1,
      warehouse: 1,
    }

    const result = deriveOccupiedPeasants(levels, catalog)

    expect(result).toEqual({ ok: true, value: 9 })
  })

  it('occupies no peasants with nothing built', () => {
    const catalog = inMemoryCatalog({})
    const levels: FiefBuildingLevels = { sawmill: 0, quarry: 0, ironMine: 0, farm: 0, warehouse: 0 }

    const result = deriveOccupiedPeasants(levels, catalog)

    expect(result).toEqual({ ok: true, value: 0 })
  })

  it('refuses a building level the catalog does not know', () => {
    const catalog = inMemoryCatalog({})
    const levels: FiefBuildingLevels = { sawmill: 4, quarry: 0, ironMine: 0, farm: 0, warehouse: 0 }

    const result = deriveOccupiedPeasants(levels, catalog)

    expect(result).toEqual({
      ok: false,
      error: { kind: 'UnknownBuildingLevel', building: 'sawmill', level: 4 },
    })
  })
})
