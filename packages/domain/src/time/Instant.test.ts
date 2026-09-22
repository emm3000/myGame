import { assert, describe, expect, it } from 'vitest'
import type { Clock } from '../ports/Clock'
import { Duration } from './Duration'
import { Instant } from './Instant'

const frozenClock = (epochMilliseconds: number): Clock => {
  const frozenNow = Instant.fromEpochMilliseconds(epochMilliseconds)
  return { now: () => frozenNow }
}

const durationOfSeconds = (seconds: number): Duration => {
  const result = Duration.ofSeconds(seconds)
  assert(result.ok)
  return result.value
}

describe('Instant', () => {
  it('adds a duration to an instant', () => {
    const clock = frozenClock(1_000_000)
    const buildTime = durationOfSeconds(90)

    const finishedAt = clock.now().plus(buildTime)

    expect(finishedAt.epochMilliseconds).toBe(1_090_000)
  })

  it('reports the elapsed seconds between two instants', () => {
    const storedAt = Instant.fromEpochMilliseconds(1_000_000)
    const clock = frozenClock(1_150_000)

    expect(clock.now().secondsSince(storedAt)).toBe(150)
  })
})
