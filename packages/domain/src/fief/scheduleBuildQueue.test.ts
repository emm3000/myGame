import { assert, describe, expect, it } from 'vitest'
import { Instant } from '../time/Instant'
import type { BuildQueueEntry } from './BuildQueue'
import type { BuildSlot } from './BuildSlot'
import { scheduleBuildQueue } from './scheduleBuildQueue'

const slotFinishing = Instant.fromEpochMilliseconds(1_000_000)

const busySlot: BuildSlot = {
  kind: 'busy',
  building: 'sawmill',
  targetLevel: 1,
  startedAt: Instant.fromEpochMilliseconds(880_000),
  finishesAt: slotFinishing,
  cost: { wood: 60, stone: 15, iron: 0, gold: 0, food: 0 },
}

const entry = (
  building: BuildQueueEntry['building'],
  durationSeconds: number,
): BuildQueueEntry => ({
  building,
  targetLevel: 1,
  cost: { wood: 50, stone: 25, iron: 0, gold: 0, food: 0 },
  durationSeconds,
})

describe('scheduleBuildQueue', () => {
  it('starts each waiting upgrade the instant the one before it finishes', () => {
    const scheduled = scheduleBuildQueue(busySlot, [entry('quarry', 150), entry('farm', 120)])

    assert(scheduled.ok)
    expect(
      scheduled.value.map(({ building, startsAt, finishesAt }) => ({
        building,
        startsAt: startsAt.epochMilliseconds,
        finishesAt: finishesAt.epochMilliseconds,
      })),
    ).toEqual([
      { building: 'quarry', startsAt: 1_000_000, finishesAt: 1_150_000 },
      { building: 'farm', startsAt: 1_150_000, finishesAt: 1_270_000 },
    ])
  })

  it('schedules nothing behind an idle slot', () => {
    expect(scheduleBuildQueue({ kind: 'idle' }, [entry('quarry', 150)])).toEqual({
      ok: true,
      value: [],
    })
  })
})
