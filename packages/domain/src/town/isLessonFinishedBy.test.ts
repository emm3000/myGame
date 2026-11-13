import { describe, expect, it } from 'vitest'
import { Instant } from '../time/Instant'
import { isLessonFinishedBy } from './isLessonFinishedBy'

const finishesAt = Instant.fromEpochMilliseconds(Date.parse('2026-11-12T09:00:00Z'))

describe('isLessonFinishedBy', () => {
  it('counts a lesson as finished at its finish', () => {
    expect(isLessonFinishedBy({ finishesAt }, finishesAt)).toBe(true)
  })

  it('counts a lesson as running a moment before its finish', () => {
    expect(
      isLessonFinishedBy(
        { finishesAt },
        Instant.fromEpochMilliseconds(finishesAt.epochMilliseconds - 1),
      ),
    ).toBe(false)
  })
})
