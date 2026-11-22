import { Instant } from '@mygame/domain'
import { describe, expect, it } from 'vitest'
import { placementScoreFromRow } from './placementScoreFromRow'

const takenAt = new Date('2026-11-12T09:12:00Z')

describe('placementScoreFromRow', () => {
  it('answers a stored score with its band and instant', () => {
    expect(placementScoreFromRow({ band: 3, score: 29, takenAt })).toEqual({
      ok: true,
      value: { band: 3, score: 29, takenAt: Instant.fromEpochMilliseconds(takenAt.getTime()) },
    })
  })

  it('refuses a stored band past the third', () => {
    expect(placementScoreFromRow({ band: 4, score: 30, takenAt })).toEqual({
      ok: false,
      error: { kind: 'UnknownBand', band: 4 },
    })
  })
})
