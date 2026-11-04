import { assert, describe, expect, it } from 'vitest'
import { Instant } from '../time/Instant'
import { MemoryCard } from './MemoryCard'

const enteredAt = Instant.fromEpochMilliseconds(1_669_724_000_000)

const lastReviewAt = Instant.fromEpochMilliseconds(1_669_725_000_000)

const learningCardWith = (overrides: {
  step?: number
  stability?: number
  difficulty?: number
}): ReturnType<typeof MemoryCard.restore> =>
  MemoryCard.restore({
    state: 'learning',
    step: 1,
    stability: 2.3065,
    difficulty: 2.1181,
    lastReviewAt,
    lastRating: 'good',
    enteredAt,
    retainedAt: null,
    ...overrides,
  })

describe('MemoryCard', () => {
  it('restores a reviewed card inside every invariant', () => {
    const card = learningCardWith({})

    assert(card.ok)
    expect(card.value.stored).toEqual({
      state: 'learning',
      step: 1,
      stability: 2.3065,
      difficulty: 2.1181,
      lastReviewAt,
      lastRating: 'good',
      enteredAt,
      retainedAt: null,
    })
  })

  it('enters a card in learning at step 0 with no memory yet', () => {
    expect(MemoryCard.entered(enteredAt).stored).toEqual({
      state: 'learning',
      step: 0,
      stability: null,
      difficulty: null,
      lastReviewAt: null,
      lastRating: null,
      enteredAt,
      retainedAt: null,
    })
  })

  it('refuses a negative step', () => {
    expect(learningCardWith({ step: -1 })).toEqual({
      ok: false,
      error: { kind: 'InvalidMemoryCard', field: 'step', value: -1 },
    })
  })

  it('refuses a fractional step', () => {
    expect(learningCardWith({ step: 0.5 })).toEqual({
      ok: false,
      error: { kind: 'InvalidMemoryCard', field: 'step', value: 0.5 },
    })
  })

  it('refuses a stability of zero', () => {
    expect(learningCardWith({ stability: 0 })).toEqual({
      ok: false,
      error: { kind: 'InvalidMemoryCard', field: 'stability', value: 0 },
    })
  })

  it('refuses a stability that is not a number', () => {
    const card = learningCardWith({ stability: Number.NaN })

    assert(!card.ok)
    expect(card.error).toMatchObject({ kind: 'InvalidMemoryCard', field: 'stability' })
  })

  it('refuses a difficulty under 1', () => {
    expect(learningCardWith({ difficulty: 0.99 })).toEqual({
      ok: false,
      error: { kind: 'InvalidMemoryCard', field: 'difficulty', value: 0.99 },
    })
  })

  it('refuses a difficulty over 10', () => {
    expect(learningCardWith({ difficulty: 10.01 })).toEqual({
      ok: false,
      error: { kind: 'InvalidMemoryCard', field: 'difficulty', value: 10.01 },
    })
  })

  it('accepts the difficulty bounds 1 and 10', () => {
    expect([
      learningCardWith({ difficulty: 1 }).ok,
      learningCardWith({ difficulty: 10 }).ok,
    ]).toEqual([true, true])
  })

  it('refuses a review card of zero stability', () => {
    const card = MemoryCard.restore({
      state: 'review',
      step: null,
      stability: 0,
      difficulty: 5,
      lastReviewAt,
      lastRating: 'good',
      enteredAt,
      retainedAt: null,
    })

    assert(!card.ok)
    expect(card.error).toEqual({ kind: 'InvalidMemoryCard', field: 'stability', value: 0 })
  })
})
