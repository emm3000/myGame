import { describe, expect, it } from 'vitest'
import { PlaceRecruitOrderRequestSchema } from './index'

describe('PlaceRecruitOrderRequestSchema', () => {
  it('parses the unit and the count of an order', () => {
    expect(PlaceRecruitOrderRequestSchema.parse({ unit: 'infantry', count: 3 })).toEqual({
      unit: 'infantry',
      count: 3,
    })
  })

  it('rejects a fractional count', () => {
    expect(PlaceRecruitOrderRequestSchema.safeParse({ unit: 'infantry', count: 1.5 }).success).toBe(
      false,
    )
  })

  it('rejects a count of zero', () => {
    expect(PlaceRecruitOrderRequestSchema.safeParse({ unit: 'infantry', count: 0 }).success).toBe(
      false,
    )
  })
})
