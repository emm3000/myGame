import { describe, expect, it } from 'vitest'
import { RegionMapRequestSchema } from './index'

describe('RegionMapRequestSchema', () => {
  it('parses the area written in the path', () => {
    expect(RegionMapRequestSchema.parse({ area: '3' })).toEqual({ area: 3 })
  })

  it('rejects area 0', () => {
    expect(RegionMapRequestSchema.safeParse({ area: '0' }).success).toBe(false)
  })

  it('rejects an area that is not a whole number', () => {
    expect(RegionMapRequestSchema.safeParse({ area: '2.5' }).success).toBe(false)
  })
})
