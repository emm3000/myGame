import { assert, describe, expect, it } from 'vitest'
import { MemoryCard } from '../../memory/MemoryCard'
import { Instant } from '../../time/Instant'
import type { HeldCard } from '../HeldCard'
import { cardsInLearningOf } from './cardsInLearningOf'

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
  it('counts a card as in learning while its stability is under 4 days', () => {
    const cards = [
      { wordId: 'home', card: MemoryCard.entered(enteredAt) },
      heldAt('school', 3.99),
      heldAt('work', 4),
      heldAt('money', 6.0539),
      heldAt('food', 7),
    ]

    expect(cardsInLearningOf(cards)).toBe(2)
  })
})
