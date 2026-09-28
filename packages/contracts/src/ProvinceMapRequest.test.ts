import { describe, expect, it } from 'vitest'
import { ProvinceMapRequestSchema } from './index'

describe('ProvinceMapRequestSchema', () => {
  it('parses the province the path names', () => {
    expect(ProvinceMapRequestSchema.parse({ province: '3' })).toEqual({ province: 3 })
  })

  it('rejects a province numbered zero', () => {
    expect(ProvinceMapRequestSchema.safeParse({ province: '0' }).success).toBe(false)
  })

  it('rejects a province that is not a whole number', () => {
    const provinces = ['-1', '1.5', 'tres', '']
    expect(
      provinces.map((province) => ProvinceMapRequestSchema.safeParse({ province }).success),
    ).toEqual([false, false, false, false])
  })
})
