import { describe, expect, it } from 'vitest'
import { RecallMarchRequestSchema } from './index'

describe('RecallMarchRequestSchema', () => {
  it('parses the departure the path names', () => {
    expect(RecallMarchRequestSchema.parse({ departedAt: '2026-09-22T08:00:00.000Z' })).toEqual({
      departedAt: '2026-09-22T08:00:00.000Z',
    })
  })

  it('rejects a departure that is not an instant', () => {
    const departures = ['2026-09-22', 'ayer', '', '2026-09-22T08:00:00']
    expect(
      departures.map((departedAt) => RecallMarchRequestSchema.safeParse({ departedAt }).success),
    ).toEqual([false, false, false, false])
  })
})
