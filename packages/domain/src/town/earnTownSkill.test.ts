import { assert, describe, expect, it } from 'vitest'
import { plainTownSettings, townCatalogOf } from '../testing/townCatalogOf'
import { townOf } from '../testing/townFixtures'
import { Instant } from '../time/Instant'
import { accrueTown } from './accrueTown'
import { earnTownSkill } from './earnTownSkill'
import type { TownSkill } from './TownSkill'

const MILLISECONDS_PER_HOUR = 3_600_000

const hoursAfterEpoch = (hours: number): Instant =>
  Instant.fromEpochMilliseconds(
    plainTownSettings.seasons.epoch.epochMilliseconds + hours * MILLISECONDS_PER_HOUR,
  )

const farmingTown = townOf({
  area: 2,
  stocks: { money: 0, food: 0, power: 0, material: 0 },
  storedAt: hoursAfterEpoch(1),
  buildingLevels: { farm: 1 },
})

const foodSkill: TownSkill = {
  lessonId: 'lesson-1',
  resource: 'food',
  ratePercent: 5,
  earnedAt: hoursAfterEpoch(2),
}

describe('earnTownSkill', () => {
  it("re-bases the town's stocks at an earn", () => {
    const earned = earnTownSkill(farmingTown, foodSkill, townCatalogOf())

    assert(earned.ok)
    expect(earned.value.town.storedAt).toEqual(hoursAfterEpoch(2))
    expect(earned.value.town.stocks).toEqual({ money: 12, food: 30, power: 5, material: 0 })
    expect(earned.value.town.skills).toEqual([foodSkill])
  })

  it('raises the rate from the earn on', () => {
    const earned = earnTownSkill(farmingTown, foodSkill, townCatalogOf())
    assert(earned.ok)

    const accrual = accrueTown(earned.value.town, townCatalogOf(), hoursAfterEpoch(4))

    assert(accrual.ok)
    expect(accrual.value.stocks.food).toBe(93)
  })

  it('answers skillEarned at the earn', () => {
    const earned = earnTownSkill(farmingTown, foodSkill, townCatalogOf())

    assert(earned.ok)
    expect(earned.value.events).toEqual([
      {
        kind: 'skillEarned',
        lessonId: 'lesson-1',
        resource: 'food',
        ratePercent: 5,
        occurredAt: hoursAfterEpoch(2),
      },
    ])
  })
})
