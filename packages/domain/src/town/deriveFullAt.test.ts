import { assert, describe, expect, it } from 'vitest'
import { plainTownSettings, townCatalogOf } from '../testing/townCatalogOf'
import { townOf } from '../testing/townFixtures'
import { Instant } from '../time/Instant'
import { accrueTown } from './accrueTown'
import { deriveFullAt } from './deriveFullAt'
import type { Town } from './Town'
import type { TownSettings } from './TownSettings'

const MILLISECONDS_PER_HOUR = 3_600_000

const MILLISECONDS_PER_MINUTE = 60_000

const HOURS_PER_SEASON = 7 * 24

const seasonEpoch = plainTownSettings.seasons.epoch

const hoursAfterEpoch = (hours: number): Instant =>
  Instant.fromEpochMilliseconds(seasonEpoch.epochMilliseconds + hours * MILLISECONDS_PER_HOUR)

const unscaled = { money: 100, food: 100, power: 100, material: 100 }

const foodOnlyInSpring = { ...unscaled, food: 0 }

const springFoodSettings: TownSettings = {
  ...plainTownSettings,
  seasons: {
    ...plainTownSettings.seasons,
    productionPercent: {
      spring: unscaled,
      summer: foodOnlyInSpring,
      fall: foodOnlyInSpring,
      winter: foodOnlyInSpring,
    },
  },
}

const winterFoodSettings: TownSettings = {
  ...plainTownSettings,
  seasons: {
    ...plainTownSettings.seasons,
    productionPercent: {
      spring: foodOnlyInSpring,
      summer: foodOnlyInSpring,
      fall: foodOnlyInSpring,
      winter: unscaled,
    },
  },
}

const boundaryCrossingTown = (): Town =>
  townOf({
    area: 2,
    stocks: { money: 0, food: 988, power: 0, material: 0 },
    storedAt: Instant.fromEpochMilliseconds(
      hoursAfterEpoch(HOURS_PER_SEASON).epochMilliseconds - 3 * MILLISECONDS_PER_MINUTE,
    ),
    buildingLevels: { farm: 1 },
  })

describe('deriveFullAt', () => {
  it('answers the crossing instant inside its season segment', () => {
    const fillingTown = townOf({
      area: 2,
      stocks: { money: 0, food: 700, power: 0, material: 0 },
      storedAt: hoursAfterEpoch(HOURS_PER_SEASON - 8),
      buildingLevels: { farm: 1 },
    })

    const fullAt = deriveFullAt(fillingTown, townCatalogOf(springFoodSettings))

    assert(fullAt.ok)
    expect(fullAt.value.food).toEqual(hoursAfterEpoch(4 * HOURS_PER_SEASON + 2))
  })

  it('answers null for a rate of 0 in every season', () => {
    const idleFarmTown = townOf({
      area: 2,
      stocks: { money: 0, food: 700, power: 0, material: 0 },
      storedAt: hoursAfterEpoch(1),
    })

    const fullAt = deriveFullAt(idleFarmTown, townCatalogOf(springFoodSettings))

    assert(fullAt.ok)
    expect(fullAt.value.food).toBeNull()
  })

  it('waits out a whole year of seasons after an unchanged segment before the epoch', () => {
    const preEpochTown = townOf({
      area: 2,
      stocks: { money: 0, food: 700, power: 0, material: 0 },
      storedAt: Instant.fromEpochMilliseconds(
        seasonEpoch.epochMilliseconds - MILLISECONDS_PER_MINUTE,
      ),
      buildingLevels: { farm: 1 },
    })

    const fullAt = deriveFullAt(preEpochTown, townCatalogOf(winterFoodSettings))

    assert(fullAt.ok)
    expect(fullAt.value.food).toEqual(hoursAfterEpoch(3 * HOURS_PER_SEASON + 10))
  })

  it('answers the stored instant for a full store', () => {
    const fullTown = townOf({
      area: 2,
      stocks: { money: 0, food: 1000, power: 0, material: 0 },
      storedAt: hoursAfterEpoch(5),
      buildingLevels: { farm: 1 },
    }).withFullSince({ money: null, food: hoursAfterEpoch(3), power: null, material: null })

    const fullAt = deriveFullAt(fullTown, townCatalogOf())

    assert(fullAt.ok)
    expect(fullAt.value.food).toEqual(hoursAfterEpoch(3))
  })

  it('answers the stored instant of the town for a full store with no instant stored', () => {
    const overfullTown = townOf({
      area: 2,
      stocks: { money: 0, food: 1200, power: 0, material: 0 },
      storedAt: hoursAfterEpoch(5),
      buildingLevels: { farm: 1 },
    })

    const fullAt = deriveFullAt(overfullTown, townCatalogOf())

    assert(fullAt.ok)
    expect(fullAt.value.food).toEqual(hoursAfterEpoch(5))
  })

  it('floors the stock at each season boundary before the crossing', () => {
    const fullAt = deriveFullAt(boundaryCrossingTown(), townCatalogOf())

    assert(fullAt.ok)
    expect(fullAt.value.food).toEqual(
      Instant.fromEpochMilliseconds(
        hoursAfterEpoch(HOURS_PER_SEASON).epochMilliseconds + 22 * MILLISECONDS_PER_MINUTE,
      ),
    )
  })

  it('fills at the instant accrueTown first reads the store full', () => {
    const slowTown = boundaryCrossingTown()
    const catalog = townCatalogOf()

    const fullAt = deriveFullAt(slowTown, catalog)

    assert(fullAt.ok && fullAt.value.food !== null)
    const justBefore = Instant.fromEpochMilliseconds(fullAt.value.food.epochMilliseconds - 1)
    const before = accrueTown(slowTown, catalog, justBefore)
    const at = accrueTown(slowTown, catalog, fullAt.value.food)
    assert(before.ok && at.ok)
    expect(before.value.fullSince.food).toBeNull()
    expect(at.value.fullSince.food).toEqual(fullAt.value.food)
  })
})
