import { describe, expect, it } from 'vitest'
import { Instant } from '../time/Instant'
import { placedOutBandsOf } from './placedOutBandsOf'
import { placementScoresOf } from './placementScoresOf'

const takenAt = Instant.fromEpochMilliseconds(Date.parse('2026-11-12T09:12:00Z'))

describe('placedOutBandsOf', () => {
  it('places a player out of every band scored 29 or more', () => {
    const scores = [
      { band: 1, score: 30, takenAt },
      { band: 2, score: 29, takenAt },
      { band: 3, score: 28, takenAt },
    ]

    expect(placedOutBandsOf(scores)).toEqual([1, 2])
  })

  it('places a skipped player out of no band', () => {
    expect(placedOutBandsOf(placementScoresOf({ kind: 'skipped', skippedAt: takenAt }))).toEqual([])
  })

  it('places a player who took no placement out of no band', () => {
    expect(placedOutBandsOf(placementScoresOf(undefined))).toEqual([])
  })
})
