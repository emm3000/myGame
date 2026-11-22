import { describe, expect, it } from 'vitest'
import { Instant } from '#time/Instant'
import { readInstantOf } from './readInstantOf'

const storedAt = Instant.fromEpochMilliseconds(1_000_000)

describe('readInstantOf', () => {
  it('reads a town at its stored instant when the clock is behind it', () => {
    const behind = Instant.fromEpochMilliseconds(999_000)

    expect(readInstantOf(behind, storedAt)).toBe(storedAt)
  })

  it('reads a town at now when the clock is past its stored instant', () => {
    const past = Instant.fromEpochMilliseconds(1_001_000)

    expect(readInstantOf(past, storedAt)).toBe(past)
  })

  it('reads at now when no town is stored', () => {
    const now = Instant.fromEpochMilliseconds(1_000_000)

    expect(readInstantOf(now, undefined)).toBe(now)
  })
})
