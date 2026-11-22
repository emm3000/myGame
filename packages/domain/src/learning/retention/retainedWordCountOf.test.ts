import { assert, describe, expect, it } from 'vitest'
import { MemoryCard } from '#memory/domain/MemoryCard'
import { Instant } from '#time/Instant'
import type { HeldCard } from '../HeldCard'
import { isWordRetained } from './isWordRetained'
import { retainedWordCountOf } from './retainedWordCountOf'
import { stableWordCountOf } from './stableWordCountOf'

const enteredAt = Instant.fromEpochMilliseconds(Date.parse('2026-11-10T09:00:00Z'))

const reviewedAt = Instant.fromEpochMilliseconds(Date.parse('2026-11-23T09:10:00Z'))

const reviewedCardOf = (
  wordId: string,
  stability: number,
  retainedAt: Instant | null,
): HeldCard => {
  const card = MemoryCard.restore({
    state: 'review',
    step: null,
    stability,
    difficulty: 2.0975,
    lastReviewAt: reviewedAt,
    lastRating: 'good',
    enteredAt,
    retainedAt,
  })
  assert(card.ok)
  return { wordId, card: card.value }
}

describe('retainedWordCountOf', () => {
  it('counts a card isWordRetained proves as retained', () => {
    const proven = reviewedCardOf('work', 12, reviewedAt)
    assert(isWordRetained(proven))

    expect(retainedWordCountOf([proven])).toBe(1)
  })

  it('counts a stable card with no proof as stable but not retained', () => {
    const unproven = [reviewedCardOf('work', 12, null)]

    expect(stableWordCountOf(unproven)).toBe(1)
    expect(retainedWordCountOf(unproven)).toBe(0)
  })
})
