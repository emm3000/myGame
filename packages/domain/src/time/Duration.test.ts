import { describe, expect, it } from 'vitest'
import { Duration } from './Duration'

describe('Duration', () => {
  it('rejects a negative duration', () => {
    const result = Duration.ofSeconds(-1)

    expect(result).toEqual({ ok: false, error: { kind: 'NegativeDuration', seconds: -1 } })
  })
})
