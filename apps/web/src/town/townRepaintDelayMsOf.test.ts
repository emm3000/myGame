import { expect, it } from 'vitest'
import { knownTown } from '../auth/stubApiClient.testSupport'
import { liveTownAt } from './liveTown'
import { townRepaintDelayMsOf } from './townRepaintDelayMsOf'

const finishesAfter = (seconds: number): string =>
  new Date(Date.parse(knownTown.readAt) + seconds * 1000).toISOString()

const townWith = (lessonFinishSeconds: number, nextDueSeconds: number | null) =>
  liveTownAt(
    {
      ...knownTown,
      lessonSlot: {
        lessonId: 'lesson-1',
        startedAt: finishesAfter(-300),
        finishesAt: finishesAfter(lessonFinishSeconds),
      },
      nextDueAt: nextDueSeconds === null ? null : finishesAfter(nextDueSeconds),
    },
    0,
  )

it("repaints every second in a countdown's last minute", () => {
  expect(townRepaintDelayMsOf(townWith(45, null))).toBe(1000)
})

it('ignores a countdown already at zero', () => {
  expect(townRepaintDelayMsOf(townWith(0, 600))).toBe(60_000)
})

it('repaints once a minute with every countdown at zero', () => {
  expect(townRepaintDelayMsOf(townWith(0, null))).toBe(60_000)
})
