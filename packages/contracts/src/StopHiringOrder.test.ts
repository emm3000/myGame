import { describe, expect, it } from 'vitest'
import { StopHiringOrderSchema } from './index'

describe('StopHiringOrderSchema', () => {
  it('parses the hire and the start of the order', () => {
    const target = { hire: 'worker', startedAt: '2026-11-10T08:55:00.000Z' }

    expect(StopHiringOrderSchema.parse(target)).toEqual(target)
  })

  it('rejects a start that is not an instant', () => {
    expect(
      StopHiringOrderSchema.safeParse({ hire: 'worker', startedAt: 'yesterday' }).success,
    ).toBe(false)
  })
})
