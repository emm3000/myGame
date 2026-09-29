import { assert, describe, expect, it } from 'vitest'
import type {
  BuildingCatalog,
  BuildingLevel,
  FarmLevel,
  FiefSettings,
  ProducerLevel,
} from '../ports/BuildingCatalog'
import { neutralSeasons } from '../testing/neutralSeasons'
import { plainUnits } from '../testing/plainUnits'
import type { BuildQueueEntry } from './BuildQueue'
import { entryFitsProjection } from './entryFitsProjection'
import type { FiefBuildingLevels } from './FiefBuildingLevels'
import { FiefUnitCounts } from './FiefUnitCounts'

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
  units: plainUnits,
  seasons: neutralSeasons,
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
  artLevelOf: () => undefined,
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
  library: 0,
  barracks: 0,
  ...levels,
})

const upgradeTo = (
  building: BuildQueueEntry['building'],
  targetLevel: number,
): BuildQueueEntry => ({
  building,
  targetLevel,
  cost: { wood: 0, stone: 0, iron: 0, gold: 0, food: 0 },
  durationSeconds: 60,
})

describe('entryFitsProjection', () => {
  it('fits an entry whose peasant increase the projected free peasants cover', () => {
    const projectedWithFarm = levelsWith({ farm: 1 })

    const result = entryFitsProjection(
      projectedWithFarm,
      FiefUnitCounts.none,
      upgradeTo('sawmill', 1),
      catalog,
    )

    expect(result).toEqual({ ok: true, value: true })
  })

  it('answers that an entry does not fit the peasants the units occupy', () => {
    const nineInfantry = FiefUnitCounts.create({ infantry: 9 })
    assert(nineInfantry.ok)

    const result = entryFitsProjection(
      levelsWith({ farm: 1 }),
      nineInfantry.value,
      upgradeTo('sawmill', 1),
      catalog,
    )

    expect(result).toEqual({ ok: true, value: false })
  })

  it('answers that no entry fits a projection that occupies more peasants than it supplies', () => {
    const overcrowded = levelsWith({ sawmill: 2 })

    const result = entryFitsProjection(
      overcrowded,
      FiefUnitCounts.none,
      upgradeTo('farm', 1),
      catalog,
    )

    expect(result).toEqual({ ok: true, value: false })
  })

  it('reports a projected level the catalog does not know', () => {
    const projectedBeyondCatalog = levelsWith({ sawmill: 3 })

    const result = entryFitsProjection(
      projectedBeyondCatalog,
      FiefUnitCounts.none,
      upgradeTo('farm', 1),
      catalog,
    )

    expect(result).toEqual({
      ok: false,
      error: { kind: 'UnknownBuildingLevel', building: 'sawmill', level: 3 },
    })
  })
})
