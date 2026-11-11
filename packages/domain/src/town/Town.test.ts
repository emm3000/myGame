import { assert, describe, expect, it } from 'vitest'
import { townCatalogOf } from '../testing/townCatalogOf'
import { storedTownOf } from '../testing/townFixtures'
import { Instant } from '../time/Instant'
import { accrueTown } from './accrueTown'
import type { HiringOrder } from './HiringOrder'
import type { Job } from './Job'
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

  describe('hiring', () => {
    const secondsAfterStored = (seconds: number): Instant =>
      Instant.fromEpochMilliseconds(storedAt.epochMilliseconds + seconds * 1_000)

    const threeTrucks: HiringOrder = {
      kind: 'busy',
      hire: 'truck',
      count: 3,
      costPerHire: { money: 60, food: 0, power: 20, material: 40 },
      secondsPerHire: 100,
      startedAt: storedAt,
    }

    it('delivers hires one by one on read', () => {
      const restored = Town.restore({
        ...storedTownOf({ storedAt }),
        hires: { worker: 1, truck: 2 },
        hiringSlot: threeTrucks,
      })
      assert(restored.ok)

      const trucksRead = [0, 99, 100, 250, 300, 900].map(
        (seconds) => restored.value.hiresAt(secondsAfterStored(seconds)).truck,
      )

      expect(trucksRead).toEqual([2, 2, 3, 4, 5, 5])
    })

    it('refuses a stored hire count that is not whole from 0', () => {
      const restored = Town.restore({
        ...storedTownOf({ storedAt }),
        hires: { worker: -1, truck: 0 },
      })

      expect(restored).toEqual({
        ok: false,
        error: { kind: 'InvalidHireCount', hire: 'worker', count: -1 },
      })
    })

    it('refuses a stored order whose count is not whole from 1', () => {
      const restored = Town.restore({
        ...storedTownOf({ storedAt }),
        hiringSlot: { ...threeTrucks, count: 0 },
      })

      expect(restored).toEqual({
        ok: false,
        error: { kind: 'InvalidHireCount', hire: 'truck', count: 0 },
      })
    })

    it('refuses a stored order whose seconds per hire are not whole from 1', () => {
      const restored = Town.restore({
        ...storedTownOf({ storedAt }),
        hiringSlot: { ...threeTrucks, secondsPerHire: 0.5 },
      })

      expect(restored).toEqual({
        ok: false,
        error: { kind: 'InvalidHireDuration', hire: 'truck', secondsPerHire: 0.5 },
      })
    })

    it('refuses a stored order with a negative cost per hire', () => {
      const restored = Town.restore({
        ...storedTownOf({ storedAt }),
        hiringSlot: { ...threeTrucks, costPerHire: { money: -1, food: 0, power: 0, material: 0 } },
      })

      expect(restored).toEqual({
        ok: false,
        error: { kind: 'NegativeResourceAmount', amount: -1 },
      })
    })

    it('founds a town with no hires and an idle hiring slot', () => {
      const stored = storedTownOf({ storedAt })
      const founded = Town.found({ ...stored, startingStocks: stored.stocks, at: storedAt })

      expect([founded.hires, founded.hiringSlot]).toEqual([
        { worker: 0, truck: 0 },
        { kind: 'idle' },
      ])
    })
  })

  describe('jobs', () => {
    const secondsAfterStored = (seconds: number): Instant =>
      Instant.fromEpochMilliseconds(storedAt.epochMilliseconds + seconds * 1_000)

    const twoHourJob: Job = {
      kind: 'out',
      site: { region: 1, area: 1, site: 5 },
      team: { worker: 2, truck: 1 },
      hours: 2,
      sentAt: storedAt,
      oneWaySeconds: 600,
      pay: { money: 0, food: 20, power: 0, material: 20 },
      payPercent: { money: 100, food: 100, power: 100, material: 100 },
    }

    const restoredWith = (job: Job, at: Instant = storedAt): ReturnType<typeof Town.restore> =>
      Town.restore({
        ...storedTownOf({ storedAt: at }),
        hires: { worker: 3, truck: 1 },
        jobSlot: job,
      })

    it('keeps the team out of the hires at home', () => {
      const restored = restoredWith(twoHourJob)
      assert(restored.ok)

      expect([restored.value.hiresAt(storedAt), restored.value.hiresAtHomeAt(storedAt)]).toEqual([
        { worker: 3, truck: 1 },
        { worker: 1, truck: 0 },
      ])
    })

    it('refuses a stored team with a count that is not whole from 0 or no hire at all', () => {
      const teams = [
        { worker: -1, truck: 1 },
        { worker: 0.5, truck: 1 },
        { worker: 0, truck: 0 },
      ]

      expect(teams.map((team) => restoredWith({ ...twoHourJob, team }))).toEqual(
        teams.map((team) => ({ ok: false, error: { kind: 'InvalidTeam', team } })),
      )
    })

    it('refuses stored hours that are not whole from 1', () => {
      expect([0, 1.5].map((hours) => restoredWith({ ...twoHourJob, hours }))).toEqual([
        { ok: false, error: { kind: 'InvalidJobHours', hours: 0 } },
        { ok: false, error: { kind: 'InvalidJobHours', hours: 1.5 } },
      ])
    })

    it('refuses a stored road that is negative or fractional', () => {
      expect(
        [-1, 0.5].map((oneWaySeconds) => restoredWith({ ...twoHourJob, oneWaySeconds })),
      ).toEqual([
        { ok: false, error: { kind: 'NegativeDuration', seconds: -1 } },
        { ok: false, error: { kind: 'FractionalDuration', seconds: 0.5 } },
      ])
    })

    it('refuses a stored pay that is not whole from 0', () => {
      const pay = { money: 0, food: 2.5, power: 0, material: 0 }

      expect(restoredWith({ ...twoHourJob, pay })).toEqual({
        ok: false,
        error: { kind: 'FractionalResourceAmount', amount: 2.5 },
      })
    })

    it('refuses a stored pay percent that is not whole from 1', () => {
      const payPercent = { money: 100, food: 100, power: 0, material: 100 }

      expect(restoredWith({ ...twoHourJob, payPercent })).toEqual({
        ok: false,
        error: { kind: 'InvalidPayPercent', resource: 'power', percent: 0 },
      })
    })

    it('refuses a stored call back before the dispatch or once the work is over', () => {
      const beforeDispatch = secondsAfterStored(-1)
      const workOver = secondsAfterStored(600 + 7_200)

      expect([
        restoredWith({ ...twoHourJob, calledBackAt: beforeDispatch }, beforeDispatch),
        restoredWith({ ...twoHourJob, calledBackAt: workOver }),
      ]).toEqual([
        {
          ok: false,
          error: { kind: 'SlotStartsAfterFinish', startedAt: storedAt, finishesAt: beforeDispatch },
        },
        {
          ok: false,
          error: { kind: 'SlotStartsAfterFinish', startedAt: workOver, finishesAt: workOver },
        },
      ])
    })

    it('refuses a stored job that returns before the stored instant', () => {
      const returnsAt = secondsAfterStored(600 + 7_200 + 600)
      const laterStored = secondsAfterStored(600 + 7_200 + 601)

      expect(restoredWith(twoHourJob, laterStored)).toEqual({
        ok: false,
        error: { kind: 'SlotFinishesBeforeStored', storedAt: laterStored, finishesAt: returnsAt },
      })
    })

    it('founds a town with no team out', () => {
      const stored = storedTownOf({ storedAt })
      const founded = Town.found({ ...stored, startingStocks: stored.stocks, at: storedAt })

      expect(founded.jobSlot).toEqual({ kind: 'idle' })
    })
  })
})
