import { describe, expect, it } from 'vitest'
import { JobQuoteSchema } from './index'

const quote = { pay: { money: 0, food: 12, power: 0, material: 12 } }

describe('JobQuoteSchema', () => {
  it('parses the pay a job would bring', () => {
    expect(JobQuoteSchema.parse(quote)).toEqual(quote)
  })

  it('rejects a fractional pay', () => {
    expect(JobQuoteSchema.safeParse({ pay: { ...quote.pay, food: 1.5 } }).success).toBe(false)
  })

  it('rejects a quote with a field beyond the pay', () => {
    expect(JobQuoteSchema.safeParse({ ...quote, oneWaySeconds: 60 }).success).toBe(false)
  })
})
