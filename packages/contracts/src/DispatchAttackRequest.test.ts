import { describe, expect, it } from 'vitest'
import { DispatchAttackRequestSchema } from './index'

const tenInfantryOnACamp = { province: 2, plot: 4, infantry: 10 }

describe('DispatchAttackRequestSchema', () => {
  it('parses the target and the infantry of an attack', () => {
    expect(DispatchAttackRequestSchema.parse(tenInfantryOnACamp)).toEqual(tenInfantryOnACamp)
  })

  it('rejects an attack with no infantry', () => {
    expect(
      DispatchAttackRequestSchema.safeParse({ ...tenInfantryOnACamp, infantry: 0 }).success,
    ).toBe(false)
  })

  it('rejects a fractional plot', () => {
    expect(
      DispatchAttackRequestSchema.safeParse({ ...tenInfantryOnACamp, plot: 4.5 }).success,
    ).toBe(false)
  })
})
