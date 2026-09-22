import { describe, expect, it } from 'vitest'
import { SystemClock } from './SystemClock'

const projectStart = Date.parse('2026-09-21T00:00:00Z')

describe('SystemClock', () => {
  it('reads the wall clock rather than a fixed instant', () => {
    const clock = new SystemClock()

    expect(clock.now().epochMilliseconds).toBeGreaterThan(projectStart)
  })
})
