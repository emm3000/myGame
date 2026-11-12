import { describe, expect, it } from 'vitest'
import { CleanUpQuoteSchema } from './index'

const quote = { strength: 6, waste: 6, pay: { money: 12, food: 0, power: 0, material: 18 } }

describe('CleanUpQuoteSchema', () => {
  it("parses the team's strength, the site's waste and the pay a clean-up would bring", () => {
    expect(CleanUpQuoteSchema.parse(quote)).toEqual(quote)
  })

  it('rejects a site with no waste to clean', () => {
    expect(CleanUpQuoteSchema.safeParse({ ...quote, waste: 0 }).success).toBe(false)
  })

  it('rejects a team with no strength', () => {
    expect(CleanUpQuoteSchema.safeParse({ ...quote, strength: 0 }).success).toBe(false)
  })

  it('rejects a fractional waste', () => {
    expect(CleanUpQuoteSchema.safeParse({ ...quote, waste: 1.5 }).success).toBe(false)
  })

  it('rejects a quote with a field beyond the strength, the waste and the pay', () => {
    expect(CleanUpQuoteSchema.safeParse({ ...quote, size: 1 }).success).toBe(false)
  })
})
