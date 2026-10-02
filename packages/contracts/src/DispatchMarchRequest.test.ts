import { describe, expect, it } from 'vitest'
import { DispatchMarchRequestSchema } from './index'

const fiveInfantryForTwoHours = {
  province: 2,
  plot: 5,
  units: { infantry: 5, cavalry: 0, settler: 0 },
  stayHours: 2,
}

describe('DispatchMarchRequestSchema', () => {
  it('parses the target, the party and the stay of a march', () => {
    expect(DispatchMarchRequestSchema.parse(fiveInfantryForTwoHours)).toEqual(
      fiveInfantryForTwoHours,
    )
  })

  it('accepts a march of riders alone', () => {
    const ridersAlone = {
      ...fiveInfantryForTwoHours,
      units: { infantry: 0, cavalry: 6, settler: 0 },
    }
    expect(DispatchMarchRequestSchema.parse(ridersAlone)).toEqual(ridersAlone)
  })

  it('rejects a march with no unit', () => {
    expect(
      DispatchMarchRequestSchema.safeParse({
        ...fiveInfantryForTwoHours,
        units: { infantry: 0, cavalry: 0, settler: 0 },
      }).success,
    ).toBe(false)
  })

  it('rejects a fractional rider count', () => {
    expect(
      DispatchMarchRequestSchema.safeParse({
        ...fiveInfantryForTwoHours,
        units: { infantry: 5, cavalry: 1.5, settler: 0 },
      }).success,
    ).toBe(false)
  })

  it('rejects a negative count', () => {
    expect(
      DispatchMarchRequestSchema.safeParse({
        ...fiveInfantryForTwoHours,
        units: { infantry: 6, cavalry: -1, settler: 0 },
      }).success,
    ).toBe(false)
  })

  it('rejects a party that leaves a kind out', () => {
    expect(
      DispatchMarchRequestSchema.safeParse({ ...fiveInfantryForTwoHours, units: { infantry: 5 } })
        .success,
    ).toBe(false)
  })

  it('rejects a party with a kind that does not exist', () => {
    expect(
      DispatchMarchRequestSchema.safeParse({
        ...fiveInfantryForTwoHours,
        units: { infantry: 5, cavalry: 0, archers: 2 },
      }).success,
    ).toBe(false)
  })

  it('rejects the infantry count of the single-kind wire', () => {
    expect(
      DispatchMarchRequestSchema.safeParse({ province: 2, plot: 5, infantry: 5, stayHours: 2 })
        .success,
    ).toBe(false)
  })

  it('rejects a fractional stay', () => {
    expect(
      DispatchMarchRequestSchema.safeParse({ ...fiveInfantryForTwoHours, stayHours: 1.5 }).success,
    ).toBe(false)
  })

  it('rejects a province of zero', () => {
    expect(
      DispatchMarchRequestSchema.safeParse({ ...fiveInfantryForTwoHours, province: 0 }).success,
    ).toBe(false)
  })
})
