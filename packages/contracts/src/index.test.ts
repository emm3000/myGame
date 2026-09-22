import { describe, expect, it } from 'vitest'
import { HealthResponseSchema } from './index'

describe('HealthResponseSchema', () => {
  it('parses a health response', () => {
    const okBody = { status: 'ok' }

    expect(HealthResponseSchema.parse(okBody)).toEqual({ status: 'ok' })
  })

  it('rejects a health response with an unknown status', () => {
    const degradedBody = { status: 'degraded' }

    expect(HealthResponseSchema.safeParse(degradedBody).success).toBe(false)
  })
})
