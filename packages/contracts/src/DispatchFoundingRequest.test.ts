import { describe, expect, it } from 'vitest'
import { DispatchFoundingRequestSchema } from './index'

const foundingOnProvinceTwo = { province: 2, plot: 7, name: 'Sotoverde del Páramo' }

describe('DispatchFoundingRequestSchema', () => {
  it('parses the target and the name of a founding', () => {
    expect(DispatchFoundingRequestSchema.parse(foundingOnProvinceTwo)).toEqual(
      foundingOnProvinceTwo,
    )
  })

  it('rejects a founding without a name', () => {
    expect(DispatchFoundingRequestSchema.safeParse({ province: 2, plot: 7 }).success).toBe(false)
  })

  it('rejects a founding that carries a party', () => {
    expect(
      DispatchFoundingRequestSchema.safeParse({
        ...foundingOnProvinceTwo,
        units: { infantry: 0, cavalry: 0, settler: 1 },
      }).success,
    ).toBe(false)
  })

  it('rejects a fractional plot', () => {
    expect(
      DispatchFoundingRequestSchema.safeParse({ ...foundingOnProvinceTwo, plot: 7.5 }).success,
    ).toBe(false)
  })
})
