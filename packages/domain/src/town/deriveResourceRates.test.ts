import { assert, describe, expect, it } from 'vitest'
import { plainTownSettings, townCatalogOf } from '../testing/townCatalogOf'
import { Instant } from '../time/Instant'
import type { BuildingLevels } from './BuildingLevels'
import { deriveResourceRates } from './deriveResourceRates'
import type { TownSettings } from './TownSettings'

const MILLISECONDS_PER_DAY = 86_400_000

const seasonEpoch = plainTownSettings.seasons.epoch

const daysAfterEpoch = (days: number): Instant =>
  Instant.fromEpochMilliseconds(seasonEpoch.epochMilliseconds + days * MILLISECONDS_PER_DAY)

const noBuilding: BuildingLevels = {
  homes: 0,
  farm: 0,
  factory: 0,
  powerStation: 0,
  storage: 0,
  school: 0,
  office: 0,
}

const producingLevels: BuildingLevels = { ...noBuilding, farm: 1, factory: 2, powerStation: 1 }

const seasonalSettings: TownSettings = {
  ...plainTownSettings,
  seasons: {
    ...plainTownSettings.seasons,
    productionPercent: {
      ...plainTownSettings.seasons.productionPercent,
      winter: { money: 100, food: 50, power: 125, material: 80 },
    },
  },
}

describe('deriveResourceRates', () => {
  it('derives money from the base tax rate with no building', () => {
    const rates = deriveResourceRates(noBuilding, 'hills', townCatalogOf(), daysAfterEpoch(1))

    assert(rates.ok)
    expect(rates.value.money).toBe(12)
  })

  it("gives fields food, river power and hills material on the town's own site", () => {
    const ratesOn = (terrain: 'fields' | 'river' | 'hills'): unknown => {
      const rates = deriveResourceRates(noBuilding, terrain, townCatalogOf(), daysAfterEpoch(1))
      assert(rates.ok)
      return rates.value
    }

    expect([ratesOn('fields'), ratesOn('river'), ratesOn('hills')]).toEqual([
      { money: 12, food: 5, power: 0, material: 0 },
      { money: 12, food: 0, power: 5, material: 0 },
      { money: 12, food: 0, power: 0, material: 5 },
    ])
  })

  it("scales each rate by the season's percent for that resource", () => {
    const midWinter = daysAfterEpoch(24)

    const rates = deriveResourceRates(
      producingLevels,
      'fields',
      townCatalogOf(seasonalSettings),
      midWinter,
    )

    assert(rates.ok)
    expect(rates.value).toEqual({ money: 12, food: 17.5, power: 31.25, material: 32 })
  })

  it('answers UnknownTownBuildingLevel for a producer level the content lacks', () => {
    const rates = deriveResourceRates(
      { ...noBuilding, farm: 9 },
      'fields',
      townCatalogOf(),
      daysAfterEpoch(1),
    )

    expect(rates).toEqual({
      ok: false,
      error: { kind: 'UnknownTownBuildingLevel', building: 'farm', level: 9 },
    })
  })
})
