import { describe, expect, it } from 'vitest'
import { deriveFreePeasants } from './deriveFreePeasants'

describe('deriveFreePeasants', () => {
  it('subtracts the occupied peasants from the supplied peasants', () => {
    expect(deriveFreePeasants(10, 4)).toEqual({ ok: true, value: 6 })
  })

  it('refuses free peasants that would go negative', () => {
    const result = deriveFreePeasants(4, 10)

    expect(result).toEqual({
      ok: false,
      error: { kind: 'NegativeFreePeasants', suppliedPeasants: 4, occupiedPeasants: 10 },
    })
  })
})
