import { Instant } from '@mygame/domain'
import { describe, expect, it } from 'vitest'
import { bandStartFromRow } from './bandStartFromRow'

const startedAt = new Date('2026-11-12T09:00:00Z')

describe('bandStartFromRow', () => {
  it('answers a stored band start with its band, instant and held-out words', () => {
    expect(bandStartFromRow({ band: 2, startedAt, heldOutWords: ['think'], checks: [] })).toEqual({
      ok: true,
      value: {
        band: 2,
        startedAt: Instant.fromEpochMilliseconds(startedAt.getTime()),
        heldOutWords: ['think'],
        checks: [],
      },
    })
  })

  it('refuses a stored band past the third', () => {
    expect(bandStartFromRow({ band: 4, startedAt, heldOutWords: [], checks: [] })).toEqual({
      ok: false,
      error: { kind: 'UnknownBand', band: 4 },
    })
  })
})
