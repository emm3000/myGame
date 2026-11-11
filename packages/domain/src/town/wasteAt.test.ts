import { describe, expect, it } from 'vitest'
import { Instant } from '../time/Instant'
import { wasteAt } from './wasteAt'

const MILLISECONDS_PER_HOUR = 3_600_000

const cleanedAt = Instant.fromEpochMilliseconds(1_791_158_400_000)

const hoursAfterCleanUp = (hours: number): Instant =>
  Instant.fromEpochMilliseconds(cleanedAt.epochMilliseconds + hours * MILLISECONDS_PER_HOUR)

const largestSize = { maxWaste: 40, regrowHours: 24 }

describe('wasteAt', () => {
  it("holds the size's most waste on a site never cleaned", () => {
    expect(wasteAt(largestSize, undefined, hoursAfterCleanUp(0))).toBe(40)
  })

  it('regrows waste from the last clean-up', () => {
    expect(
      [0, 3, 6, 23.9, 24, 48].map((hours) =>
        wasteAt(largestSize, cleanedAt, hoursAfterCleanUp(hours)),
      ),
    ).toEqual([0, 5, 10, 39, 40, 40])
  })

  it('reads 0 before the last clean-up', () => {
    expect(wasteAt(largestSize, cleanedAt, hoursAfterCleanUp(-2))).toBe(0)
  })
})
