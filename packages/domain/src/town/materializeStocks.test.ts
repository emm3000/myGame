import { assert, describe, expect, it } from 'vitest'
import { plainTownSettings, townCatalogOf } from '../testing/townCatalogOf'
import { townOf } from '../testing/townFixtures'
import { Instant } from '../time/Instant'
import { materializeStocks } from './materializeStocks'

const MILLISECONDS_PER_HOUR = 3_600_000

const seasonEpoch = plainTownSettings.seasons.epoch

const hoursAfterEpoch = (hours: number): Instant =>
  Instant.fromEpochMilliseconds(seasonEpoch.epochMilliseconds + hours * MILLISECONDS_PER_HOUR)

describe('materializeStocks', () => {
  it('accrues each stock from its rate up to the storage capacity', () => {
    const foundedAt = hoursAfterEpoch(1)
    const producingTown = townOf({
      area: 2,
      stocks: { money: 100, food: 950, power: 0, material: 40 },
      storedAt: foundedAt,
      buildingLevels: { farm: 1, factory: 1, powerStation: 1 },
    })

    const stocks = materializeStocks(producingTown, townCatalogOf(), hoursAfterEpoch(3))

    assert(stocks.ok)
    expect(stocks.value).toEqual({ money: 124, food: 1000, power: 60, material: 80 })
  })
})
