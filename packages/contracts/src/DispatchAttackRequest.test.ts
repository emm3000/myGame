import { describe, expect, it } from 'vitest'
import { DispatchAttackRequestSchema } from './index'

const tenInfantryOnACamp = { province: 2, plot: 4, units: { infantry: 10, cavalry: 0 } }

describe('DispatchAttackRequestSchema', () => {
  it('parses the target and the party of an attack', () => {
    expect(DispatchAttackRequestSchema.parse(tenInfantryOnACamp)).toEqual(tenInfantryOnACamp)
  })

  it('accepts an attack of infantry and riders', () => {
    const mixedParty = { ...tenInfantryOnACamp, units: { infantry: 12, cavalry: 6 } }
    expect(DispatchAttackRequestSchema.parse(mixedParty)).toEqual(mixedParty)
  })

  it('rejects an attack with no unit', () => {
    expect(
      DispatchAttackRequestSchema.safeParse({
        ...tenInfantryOnACamp,
        units: { infantry: 0, cavalry: 0 },
      }).success,
    ).toBe(false)
  })

  it('rejects a fractional rider count', () => {
    expect(
      DispatchAttackRequestSchema.safeParse({
        ...tenInfantryOnACamp,
        units: { infantry: 10, cavalry: 0.5 },
      }).success,
    ).toBe(false)
  })

  it('rejects a fractional plot', () => {
    expect(
      DispatchAttackRequestSchema.safeParse({ ...tenInfantryOnACamp, plot: 4.5 }).success,
    ).toBe(false)
  })
})
