import { describe, expect, it } from 'vitest'
import { PlaceHiringOrderSchema } from './index'

describe('PlaceHiringOrderSchema', () => {
  it('parses the hire and its count', () => {
    expect(PlaceHiringOrderSchema.parse({ hire: 'truck', count: 2 })).toEqual({
      hire: 'truck',
      count: 2,
    })
  })

  it('rejects an order of no hires', () => {
    expect(PlaceHiringOrderSchema.safeParse({ hire: 'worker', count: 0 }).success).toBe(false)
  })

  it('rejects a fractional count', () => {
    expect(PlaceHiringOrderSchema.safeParse({ hire: 'worker', count: 1.5 }).success).toBe(false)
  })

  it('rejects a hire the office does not offer', () => {
    expect(PlaceHiringOrderSchema.safeParse({ hire: 'van', count: 1 }).success).toBe(false)
  })
})
