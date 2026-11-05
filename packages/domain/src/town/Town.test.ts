import { assert, describe, expect, it } from 'vitest'
import { townCatalogOf } from '../testing/townCatalogOf'
import { storedTownOf } from '../testing/townFixtures'
import { Instant } from '../time/Instant'
import { accrueTown } from './accrueTown'
import { Town } from './Town'
import { TownAddress } from './TownAddress'
import type { TownSkill } from './TownSkill'
import { terrainOf } from './terrainOf'

const storedAt = Instant.fromEpochMilliseconds(1_791_244_800_000)

const MILLISECONDS_PER_HOUR = 3_600_000

const restoredAt = Instant.fromEpochMilliseconds(1_791_162_000_000)

const tenHoursLater = Instant.fromEpochMilliseconds(
  restoredAt.epochMilliseconds + 10 * MILLISECONDS_PER_HOUR,
)

const foodSkillAtTwentyPercent: TownSkill = {
  lessonId: 'lesson-1',
  resource: 'food',
  ratePercent: 20,
  earnedAt: restoredAt,
}

describe('Town', () => {
  it('raises production by the skills it is restored with', () => {
    const restored = Town.restore({
      ...storedTownOf({ storedAt: restoredAt }),
      skills: [foodSkillAtTwentyPercent],
    })
    assert(restored.ok)

    const accrual = accrueTown(restored.value, townCatalogOf(), tenHoursLater)

    assert(accrual.ok)
    expect(accrual.value.stocks.food).toBe(60)
  })

  it('refuses to restore a stock that is negative or fractional', () => {
    const restored = Town.restore(
      storedTownOf({ storedAt, stocks: { money: 10, food: 2.5, power: 0, material: 0 } }),
    )

    expect(restored).toEqual({
      ok: false,
      error: { kind: 'InvalidTownStock', resource: 'food', amount: 2.5 },
    })
  })

  it('refuses to restore a building level below 0', () => {
    const restored = Town.restore(storedTownOf({ storedAt, buildingLevels: { storage: -1 } }))

    expect(restored).toEqual({
      ok: false,
      error: { kind: 'InvalidTownBuildingLevel', building: 'storage', level: -1 },
    })
  })

  it('refuses to restore building work that finishes before the stored instant', () => {
    const finishesAt = Instant.fromEpochMilliseconds(storedAt.epochMilliseconds - 1000)
    const restored = Town.restore(
      storedTownOf({
        storedAt,
        workSlot: {
          kind: 'busy',
          building: 'farm',
          level: 1,
          cost: { money: 0, food: 0, power: 0, material: 0 },
          startedAt: finishesAt,
          finishesAt,
        },
      }),
    )

    expect(restored).toEqual({
      ok: false,
      error: { kind: 'SlotFinishesBeforeStored', storedAt, finishesAt },
    })
  })

  it('refuses to restore waiting work whose duration is not whole seconds', () => {
    const restored = Town.restore(
      storedTownOf({
        storedAt,
        waitingList: [
          {
            building: 'farm',
            level: 1,
            cost: { money: 0, food: 0, power: 0, material: 0 },
            durationSeconds: 1.5,
          },
        ],
      }),
    )

    expect(restored).toEqual({ ok: false, error: { kind: 'FractionalDuration', seconds: 1.5 } })
  })

  it('refuses to restore building work whose cost is not whole', () => {
    const restored = Town.restore(
      storedTownOf({
        storedAt,
        waitingList: [
          {
            building: 'farm',
            level: 1,
            cost: { money: 0, food: 0.5, power: 0, material: 0 },
            durationSeconds: 60,
          },
        ],
      }),
    )

    expect(restored).toEqual({
      ok: false,
      error: { kind: 'FractionalResourceAmount', amount: 0.5 },
    })
  })

  it('refuses an address whose area is not a whole number from 1', () => {
    expect(TownAddress.create(1, 0, 3)).toEqual({
      ok: false,
      error: { kind: 'InvalidTownAddress', region: 1, area: 0, site: 3 },
    })
  })

  it('rotates the terrain fields, river, hills by area', () => {
    expect([1, 2, 3, 4, 5, 6].map(terrainOf)).toEqual([
      'fields',
      'river',
      'hills',
      'fields',
      'river',
      'hills',
    ])
  })
})
