import { assert, describe, expect, it } from 'vitest'
import { MemoryCard } from '../memory/MemoryCard'
import { Instant } from '../time/Instant'
import { cardsInLearningOf } from './cardsInLearningOf'
import type { HeldCard } from './HeldCard'

const enteredAt = Instant.fromEpochMilliseconds(Date.parse('2026-11-10T09:00:00Z'))

const reviewedAt = Instant.fromEpochMilliseconds(Date.parse('2026-11-23T09:10:00Z'))

const heldAt = (wordId: string, stability: number): HeldCard => {
  const card = MemoryCard.restore({
    state: 'review',
    step: null,
    stability,
    difficulty: 2.0975,
    lastReviewAt: reviewedAt,
    lastRating: 'good',
    enteredAt,
    retainedAt: null,
  })
  assert(card.ok)
  return { wordId, card: card.value }
}

describe('cardsInLearningOf', () => {
  it('counts a card as in learning while its stability is under 7 days', () => {
    const cards = [
      { wordId: 'home', card: MemoryCard.entered(enteredAt) },
      heldAt('school', 6.99),
      heldAt('work', 7),
      heldAt('money', 30),
    ]

    expect(cardsInLearningOf(cards)).toBe(2)
  })
})
