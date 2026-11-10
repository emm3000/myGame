import { describe, expect, it } from 'vitest'
import { Instant } from '../time/Instant'
import projection from './projection-cases.json'
import { storeAfterSegment } from './storeAfterSegment'

describe('the shared projection cases', () => {
  it('meets every shared projection case', () => {
    expect(projection.cases.length).toBeGreaterThan(0)

    for (const projectionCase of projection.cases) {
      const store = storeAfterSegment(
        { amount: projectionCase.storedAmount, fullSince: null },
        projectionCase.ratePerHour,
        projectionCase.capacity,
        Instant.fromEpochMilliseconds(projectionCase.readAtEpochMilliseconds),
        Instant.fromEpochMilliseconds(projectionCase.nowEpochMilliseconds),
      )

      expect(store.amount, projectionCase.name).toBe(projectionCase.expectedAmount)
    }
  })
})
