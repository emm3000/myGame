import { describe, expect, it } from 'vitest'
import { bandOfRank } from './bandOfRank'

describe('bandOfRank', () => {
  it('places each thousand ranks of the list in its band', () => {
    expect([1, 1000, 1001, 2000, 2001, 2809].map(bandOfRank)).toEqual([
      { ok: true, value: 1 },
      { ok: true, value: 1 },
      { ok: true, value: 2 },
      { ok: true, value: 2 },
      { ok: true, value: 3 },
      { ok: true, value: 3 },
    ])
  })

  it('refuses a rank past the third band', () => {
    expect(bandOfRank(3001)).toEqual({ ok: false, error: { kind: 'UnknownBand', band: 4 } })
  })

  it('refuses a rank before the first', () => {
    expect(bandOfRank(0)).toEqual({ ok: false, error: { kind: 'UnknownBand', band: 0 } })
  })
})
