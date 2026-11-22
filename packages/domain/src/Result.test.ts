import { describe, expect, it } from 'vitest'
import { allOk, err, ok } from './Result'

describe('allOk', () => {
  it('answers every value, in order, when every result is ok', () => {
    expect(allOk([ok(1), ok(2), ok(3)])).toEqual({ ok: true, value: [1, 2, 3] })
  })

  it('answers the first refusal among the results', () => {
    expect(allOk([ok(1), err('second'), err('third')])).toEqual({ ok: false, error: 'second' })
  })
})
