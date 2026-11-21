import { assert, describe, expect, it } from 'vitest'
import { MemoryCard } from '#memory/MemoryCard'
import { Instant } from '#time/Instant'
import type { HeldCard } from '../HeldCard'
import { cardsInLearningOf } from './cardsInLearningOf'
import { stableWordCountOf } from './stableWordCountOf'

const enteredAt = Instant.fromEpochMilliseconds(Date.parse('2026-11-10T09:00:00Z'))

const reviewedAt = Instant.fromEpochMilliseconds(Date.parse('2026-11-23T09:10:00Z'))

const reviewedCardOf = (wordId: string, stability: number): HeldCard => {
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

describe('stableWordCountOf', () => {
  it('counts a card at stability 7 as stable', () => {
    expect(stableWordCountOf([reviewedCardOf('work', 7)])).toBe(1)
  })

  it('counts the cards at stability 7 or more as stable', () => {
    const cards = [
      { wordId: 'home', card: MemoryCard.entered(enteredAt) },
      reviewedCardOf('school', 3.99),
      reviewedCardOf('food', 6.99),
      reviewedCardOf('work', 7),
      reviewedCardOf('money', 30),
    ]

    expect(stableWordCountOf(cards)).toBe(2)
  })

  it('counts a card at 6.0539 as neither in learning nor stable', () => {
    const cards = [reviewedCardOf('school', 6.0539)]

    expect([cardsInLearningOf(cards), stableWordCountOf(cards)]).toEqual([0, 0])
  })
})
