import { describe, expect, it } from 'vitest'
import { deriveFreePeasants } from './deriveFreePeasants'

describe('deriveFreePeasants', () => {
  it('subtracts the occupied peasants from the supplied peasants', () => {
    expect(deriveFreePeasants(10, 4)).toBe(6)
  })
})
