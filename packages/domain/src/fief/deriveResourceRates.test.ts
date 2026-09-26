import { assert, describe, expect, it } from 'vitest'
import type {
  BuildingCatalog,
  FarmLevel,
  FiefSettings,
  ProducerLevel,
} from '../ports/BuildingCatalog'
import { deriveResourceRates } from './deriveResourceRates'
import type { FiefBuildingLevels } from './FiefBuildingLevels'

const noLevels: FiefBuildingLevels = { sawmill: 0, quarry: 0, ironMine: 0, farm: 0, warehouse: 0 }

const tollBaseRates = { wood: 10, stone: 10, iron: 5, gold: 2, food: 10 }

const fiefSettings = (
  bonusResource: 'wood' | 'stone' | 'iron' | 'gold' | 'food',
): FiefSettings => ({
  startingStocks: { wood: 0, stone: 0, iron: 0, gold: 0, food: 0 },
  startingCapacity: 900,
  basePeasantSupply: 6,
  plotsPerProvince: 15,
  baseRates: tollBaseRates,
  terrainBonus: {
    lowlands: { resource: bonusResource, ratePerHour: 10 },
    uplands: { resource: bonusResource, ratePerHour: 10 },
    ridges: { resource: bonusResource, ratePerHour: 10 },
  },
  buildQueueCap: 4,
})

const producerLevel = (ratePerHour: number): ProducerLevel => ({
  building: 'sawmill',
  level: 1,
  cost: { wood: 0, stone: 0, iron: 0, gold: 0, food: 0 },
  durationSeconds: 60,
  peasantOccupancy: 1,
  ratePerHour,
})

const farmLevel = (peasantSupply: number): FarmLevel => ({
  building: 'farm',
  level: 1,
  cost: { wood: 0, stone: 0, iron: 0, gold: 0, food: 0 },
  durationSeconds: 90,
  peasantOccupancy: 1,
  ratePerHour: 20,
  peasantSupply,
})

const inMemoryCatalog = (
  settings: FiefSettings,
  levels: Partial<Record<string, ProducerLevel | FarmLevel>>,
): BuildingCatalog => ({
  levelOf: (building, level) => levels[`${building}:${level}`],
  fiefSettings: () => settings,
})

describe('deriveResourceRates', () => {
  it('reads the wood rate from the sawmill level', () => {
    const catalog = inMemoryCatalog(fiefSettings('gold'), {
      'sawmill:2': { ...producerLevel(30), level: 2 },
    })
    const levels: FiefBuildingLevels = { ...noLevels, sawmill: 2 }

    const result = deriveResourceRates(levels, 'ridges', catalog)

    assert(result.ok)
    expect(result.value.wood).toBe(40)
  })

  it('raises the rate the terrain favours by the fief settings bonus', () => {
    const catalog = inMemoryCatalog(fiefSettings('wood'), {
      'sawmill:1': producerLevel(20),
    })
    const levels: FiefBuildingLevels = { ...noLevels, sawmill: 1 }

    const result = deriveResourceRates(levels, 'lowlands', catalog)

    assert(result.ok)
    expect(result.value.wood).toBe(40)
  })

  it('adds the base rate under the producer rate and the terrain bonus', () => {
    const catalog = inMemoryCatalog(
      { ...fiefSettings('iron'), baseRates: { ...tollBaseRates, iron: 7 } },
      { 'ironMine:1': { ...producerLevel(25), building: 'ironMine' } },
    )
    const levels: FiefBuildingLevels = { ...noLevels, ironMine: 1 }

    const result = deriveResourceRates(levels, 'ridges', catalog)

    assert(result.ok)
    expect(result.value.iron).toBe(42)
  })

  it('derives the base rate of every resource on a fief with no building', () => {
    const catalog = inMemoryCatalog(
      {
        ...fiefSettings('food'),
        terrainBonus: {
          lowlands: { resource: 'food', ratePerHour: 5 },
          uplands: { resource: 'stone', ratePerHour: 4 },
          ridges: { resource: 'iron', ratePerHour: 2 },
        },
        buildQueueCap: 4,
      },
      {},
    )

    const result = deriveResourceRates(noLevels, 'lowlands', catalog)

    expect(result).toEqual({
      ok: true,
      value: { wood: 10, stone: 10, iron: 5, gold: 2, food: 15 },
    })
  })

  it('refuses a building level the catalog does not know', () => {
    const catalog = inMemoryCatalog(fiefSettings('gold'), {})
    const levels: FiefBuildingLevels = { ...noLevels, sawmill: 5 }

    const result = deriveResourceRates(levels, 'ridges', catalog)

    expect(result).toEqual({
      ok: false,
      error: { kind: 'UnknownBuildingLevel', building: 'sawmill', level: 5 },
    })
  })

  it('refuses a catalog answer whose building does not match the one asked for', () => {
    const catalog = inMemoryCatalog(fiefSettings('gold'), { 'sawmill:1': farmLevel(4) })
    const levels: FiefBuildingLevels = { ...noLevels, sawmill: 1 }

    const result = deriveResourceRates(levels, 'ridges', catalog)

    expect(result).toEqual({
      ok: false,
      error: { kind: 'UnknownBuildingLevel', building: 'sawmill', level: 1 },
    })
  })
})
