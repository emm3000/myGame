import { assert, describe, expect, it } from 'vitest'
import { plainTownSettings, townCatalogOf } from '../testing/townCatalogOf'
import { townOf } from '../testing/townFixtures'
import { Instant } from '../time/Instant'
import { accrueTown } from './accrueTown'

const MILLISECONDS_PER_HOUR = 3_600_000

const seasonEpoch = plainTownSettings.seasons.epoch

const hoursAfterEpoch = (hours: number): Instant =>
  Instant.fromEpochMilliseconds(seasonEpoch.epochMilliseconds + hours * MILLISECONDS_PER_HOUR)

describe('accrueTown', () => {
  it('accrues each stock from its rate up to the storage capacity', () => {
    const producingTown = townOf({
      area: 2,
      stocks: { money: 100, food: 950, power: 0, material: 40 },
      storedAt: hoursAfterEpoch(1),
      buildingLevels: { farm: 1, factory: 1, powerStation: 1 },
    })

    const accrual = accrueTown(producingTown, townCatalogOf(), hoursAfterEpoch(3))

    assert(accrual.ok)
    expect(accrual.value.stocks).toEqual({ money: 124, food: 1000, power: 60, material: 80 })
  })

  it('marks a store full from the instant it reached the capacity', () => {
    const fillingTown = townOf({
      area: 2,
      stocks: { money: 0, food: 970, power: 0, material: 0 },
      storedAt: hoursAfterEpoch(1),
      buildingLevels: { farm: 1 },
    })

    const accrual = accrueTown(fillingTown, townCatalogOf(), hoursAfterEpoch(3))

    assert(accrual.ok)
    expect(accrual.value.fullSince).toEqual({
      money: null,
      food: hoursAfterEpoch(2),
      power: null,
      material: null,
    })
  })
})
