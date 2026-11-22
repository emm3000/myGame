import { describe, expect, it } from 'vitest'
import { placementSamplesFromRows } from './placementSamplesFromRows'

describe('placementSamplesFromRows', () => {
  it('groups the stored words of each band into its sample, in stored order', () => {
    expect(
      placementSamplesFromRows([
        { band: 1, wordId: 'word-b' },
        { band: 1, wordId: 'word-a' },
        { band: 2, wordId: 'word-c' },
      ]),
    ).toEqual({
      ok: true,
      value: [
        { band: 1, wordIds: ['word-b', 'word-a'] },
        { band: 2, wordIds: ['word-c'] },
      ],
    })
  })

  it('refuses a stored band past the third', () => {
    expect(
      placementSamplesFromRows([
        { band: 1, wordId: 'word-a' },
        { band: 4, wordId: 'word-b' },
      ]),
    ).toEqual({ ok: false, error: { kind: 'UnknownBand', band: 4 } })
  })
})
