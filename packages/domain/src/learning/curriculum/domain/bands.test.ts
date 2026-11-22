import { describe, expect, it } from 'vitest'
import { bandOf, laterBandOf } from './bands'

describe('bandOf', () => {
  it('admits each of the three bands', () => {
    expect([1, 2, 3].map(bandOf)).toEqual([
      { ok: true, value: 1 },
      { ok: true, value: 2 },
      { ok: true, value: 3 },
    ])
  })

  it('refuses a band past the third', () => {
    expect(bandOf(4)).toEqual({ ok: false, error: { kind: 'UnknownBand', band: 4 } })
  })

  it('refuses a band before the first', () => {
    expect(bandOf(0)).toEqual({ ok: false, error: { kind: 'UnknownBand', band: 0 } })
  })

  it('refuses a band between two bands', () => {
    expect(bandOf(1.5)).toEqual({ ok: false, error: { kind: 'UnknownBand', band: 1.5 } })
  })
})

describe('laterBandOf', () => {
  it('answers the band after each band but the last', () => {
    expect([laterBandOf(1), laterBandOf(2), laterBandOf(3)]).toEqual([2, 3, undefined])
  })
})
