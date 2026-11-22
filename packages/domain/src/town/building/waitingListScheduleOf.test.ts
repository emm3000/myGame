import { describe, expect, it } from 'vitest'
import { Instant } from '#time/Instant'
import { stocksOf } from '../resources/Stocks'
import type { BusyWorkSlot } from './BuildingWork'
import type { WaitingWork } from './WaitingList'
import { waitingListScheduleOf } from './waitingListScheduleOf'

const secondsAfterEpoch = (seconds: number): Instant =>
  Instant.fromEpochMilliseconds(seconds * 1000)

const noCost = stocksOf(() => 0)

const busyFarm: BusyWorkSlot = {
  kind: 'busy',
  building: 'farm',
  level: 2,
  cost: noCost,
  startedAt: secondsAfterEpoch(0),
  finishesAt: secondsAfterEpoch(100),
}

const waiting = (building: WaitingWork['building'], durationSeconds: number): WaitingWork => ({
  building,
  level: 1,
  cost: noCost,
  durationSeconds,
})

const scheduled = (
  building: BusyWorkSlot['building'],
  startedAt: Instant,
  finishesAt: Instant,
): BusyWorkSlot => ({ kind: 'busy', building, level: 1, cost: noCost, startedAt, finishesAt })

describe('waitingListScheduleOf', () => {
  it('starts each queued work when the one before it finishes and runs it for its stored duration', () => {
    const schedule = waitingListScheduleOf(busyFarm, [
      waiting('factory', 60),
      waiting('storage', 120),
      waiting('school', 30),
    ])

    expect(schedule).toEqual({
      ok: true,
      value: [
        scheduled('factory', secondsAfterEpoch(100), secondsAfterEpoch(160)),
        scheduled('storage', secondsAfterEpoch(160), secondsAfterEpoch(280)),
        scheduled('school', secondsAfterEpoch(280), secondsAfterEpoch(310)),
      ],
    })
  })

  it('schedules nothing while the waiting list is empty', () => {
    expect(waitingListScheduleOf(busyFarm, [])).toEqual({ ok: true, value: [] })
  })

  it('refuses a stored duration below zero', () => {
    expect(waitingListScheduleOf(busyFarm, [waiting('factory', -1)])).toEqual({
      ok: false,
      error: { kind: 'NegativeDuration', seconds: -1 },
    })
  })
})
