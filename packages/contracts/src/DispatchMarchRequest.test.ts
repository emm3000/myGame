import { describe, expect, it } from 'vitest'
import { DispatchMarchRequestSchema } from './index'

const fiveInfantryForTwoHours = { province: 2, plot: 5, infantry: 5, stayHours: 2 }

describe('DispatchMarchRequestSchema', () => {
  it('parses the target, the infantry and the stay of a march', () => {
    expect(DispatchMarchRequestSchema.parse(fiveInfantryForTwoHours)).toEqual(
      fiveInfantryForTwoHours,
    )
  })

  it('rejects a fractional stay', () => {
    expect(
      DispatchMarchRequestSchema.safeParse({ ...fiveInfantryForTwoHours, stayHours: 1.5 }).success,
    ).toBe(false)
  })

  it('rejects a march of zero infantry', () => {
    expect(
      DispatchMarchRequestSchema.safeParse({ ...fiveInfantryForTwoHours, infantry: 0 }).success,
    ).toBe(false)
  })

  it('rejects a province of zero', () => {
    expect(
      DispatchMarchRequestSchema.safeParse({ ...fiveInfantryForTwoHours, province: 0 }).success,
    ).toBe(false)
  })
})
