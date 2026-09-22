import { describe, expect, it } from 'vitest'
import { Resource } from './Resources'

describe('Resource', () => {
  it('rejects a negative amount', () => {
    const result = Resource.create(-1, 10, 900)

    expect(result).toEqual({ ok: false, error: { kind: 'NegativeResourceAmount', amount: -1 } })
  })

  it('rejects a negative rate', () => {
    const result = Resource.create(0, -1, 900)

    expect(result).toEqual({ ok: false, error: { kind: 'NegativeResourceRate', ratePerHour: -1 } })
  })
})
