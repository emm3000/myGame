import { describe, expect, it } from 'vitest'
import type {
  BuildingCatalog,
  BuildingLevel,
  FiefSettings,
  ProducerLevel,
} from '../ports/BuildingCatalog'
import { derivePeasantsForUpgrade } from './derivePeasantsForUpgrade'
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

const producerLevel = (
  building: ProducerLevel['building'],
  level: number,
  peasantOccupancy: number,
): ProducerLevel => ({
  building,
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

const sawmillAndQuarryCatalog = inMemoryCatalog([
  producerLevel('sawmill', 1, 1),
  producerLevel('sawmill', 2, 3),
  producerLevel('quarry', 1, 2),
])

const sawmillAtOne: FiefBuildingLevels = {
  sawmill: 1,
  quarry: 1,
  ironMine: 0,
  farm: 0,
  warehouse: 0,
}

describe('derivePeasantsForUpgrade', () => {
  it('charges the increase over the current occupancy of the building', () => {
    const result = derivePeasantsForUpgrade(sawmillAtOne, 'sawmill', 2, sawmillAndQuarryCatalog)

    expect(result).toEqual({ ok: true, value: 2 })
  })

  it('charges the whole occupancy of a first level', () => {
    const result = derivePeasantsForUpgrade(
      { ...sawmillAtOne, sawmill: 0 },
      'sawmill',
      1,
      sawmillAndQuarryCatalog,
    )

    expect(result).toEqual({ ok: true, value: 1 })
  })

  it('refuses a target level the catalog does not know', () => {
    const result = derivePeasantsForUpgrade(sawmillAtOne, 'sawmill', 3, sawmillAndQuarryCatalog)

    expect(result).toEqual({
      ok: false,
      error: { kind: 'UnknownBuildingLevel', building: 'sawmill', level: 3 },
    })
  })
})
