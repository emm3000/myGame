import type { BuildingContent, FiefContent } from '@mygame/contracts'
import { describe, expect, it } from 'vitest'
import { JsonBuildingCatalog } from './JsonBuildingCatalog'

const levelOne = {
  level: 1,
  cost: { wood: 10, stone: 5, iron: 0, gold: 0, food: 0 },
  durationSeconds: 60,
  peasantOccupancy: 1,
}

const oneLevelBuildings: ReadonlyArray<BuildingContent> = [
  { building: 'sawmill', levels: [{ ...levelOne, effect: { ratePerHour: 30 } }] },
  { building: 'quarry', levels: [{ ...levelOne, effect: { ratePerHour: 20 } }] },
  { building: 'ironMine', levels: [{ ...levelOne, effect: { ratePerHour: 10 } }] },
  { building: 'farm', levels: [{ ...levelOne, effect: { ratePerHour: 25, peasantSupply: 5 } }] },
  { building: 'warehouse', levels: [{ ...levelOne, effect: { capacity: 1500 } }] },
]

const plainFief: FiefContent = {
  startingStocks: { wood: 500, stone: 500, iron: 200, gold: 50, food: 300 },
  startingCapacity: 1000,
  basePeasantSupply: 10,
  plotsPerProvince: 15,
  terrainBonus: {
    lowlands: { resource: 'food', ratePerHour: 5 },
    uplands: { resource: 'stone', ratePerHour: 4 },
    ridges: { resource: 'iron', ratePerHour: 2 },
  },
}

const oneLevelCatalog = (): JsonBuildingCatalog =>
  new JsonBuildingCatalog(oneLevelBuildings, plainFief)

describe('JsonBuildingCatalog', () => {
  it('reports a level the building does not list as undefined', () => {
    expect(oneLevelCatalog().levelOf('sawmill', 2)).toBeUndefined()
  })

  it('reads the iron mine by its camelCase wire id', () => {
    expect(oneLevelCatalog().levelOf('ironMine', 1)).toMatchObject({
      building: 'ironMine',
      ratePerHour: 10,
    })
  })

  it('reads a farm level as a food rate plus a peasant supply', () => {
    expect(oneLevelCatalog().levelOf('farm', 1)).toMatchObject({
      building: 'farm',
      ratePerHour: 25,
      peasantSupply: 5,
    })
  })

  it('reads a warehouse level capacity as capacity units', () => {
    expect(oneLevelCatalog().levelOf('warehouse', 1)).toMatchObject({
      building: 'warehouse',
      capacityUnits: 1500,
    })
  })

  it('serves the plots per province of the fief content', () => {
    expect(oneLevelCatalog().fiefSettings().plotsPerProvince).toBe(15)
  })

  it('serves the terrain bonus of the fief content', () => {
    expect(oneLevelCatalog().fiefSettings().terrainBonus.uplands).toEqual({
      resource: 'stone',
      ratePerHour: 4,
    })
  })
})
