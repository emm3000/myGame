import { assert, describe, expect, it } from 'vitest'
import { Coordinates } from './Coordinates'

describe('Coordinates', () => {
  it('holds a kingdom, a province and a plot', () => {
    const result = Coordinates.create(1, 4, 7)

    assert(result.ok)
    expect(result.value.kingdom).toBe(1)
    expect(result.value.province).toBe(4)
    expect(result.value.plot).toBe(7)
  })

  it('refuses a plot numbered below one', () => {
    const result = Coordinates.create(1, 4, 0)

    expect(result).toEqual({
      ok: false,
      error: { kind: 'InvalidCoordinates', kingdom: 1, province: 4, plot: 0 },
    })
  })

  it('refuses a province that is not a whole number', () => {
    const result = Coordinates.create(1, 1.5, 2)

    expect(result).toEqual({
      ok: false,
      error: { kind: 'InvalidCoordinates', kingdom: 1, province: 1.5, plot: 2 },
    })
  })
})
