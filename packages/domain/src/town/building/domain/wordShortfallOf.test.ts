import { assert, describe, expect, it } from 'vitest'
import type { HeldCard } from '#learning/domain/HeldCard'
import { MemoryCard } from '#memory/domain/MemoryCard'
import { Instant } from '#time/Instant'
import type { WordNeed } from './WordNeed'
import { wordShortfallOf } from './wordShortfallOf'

const townNeed: WordNeed = { fromLevel: 3, perLevel: 10, retainedFromLevel: 7 }

const enteredAt = Instant.fromEpochMilliseconds(Date.parse('2026-11-10T09:00:00Z'))

const reviewedAt = Instant.fromEpochMilliseconds(Date.parse('2026-11-23T09:10:00Z'))

const reviewedCardOf = (wordId: string, retainedAt: Instant | null): HeldCard => {
  const card = MemoryCard.restore({
    state: 'review',
    step: null,
    stability: 12,
    difficulty: 2.0975,
    lastReviewAt: reviewedAt,
    lastRating: 'good',
    enteredAt,
    retainedAt,
  })
  assert(card.ok)
  return { wordId, card: card.value }
}

const stableCardsOf = (count: number): ReadonlyArray<HeldCard> =>
  Array.from({ length: count }, (_, index) => reviewedCardOf(`stable-${index}`, null))

const retainedCardsOf = (count: number): ReadonlyArray<HeldCard> =>
  Array.from({ length: count }, (_, index) => reviewedCardOf(`retained-${index}`, reviewedAt))

describe('wordShortfallOf', () => {
  it('finds no shortfall at a level that needs no words', () => {
    expect(wordShortfallOf(2, [], townNeed)).toBeNull()
  })

  it('counts the stable words toward a stable need', () => {
    expect(wordShortfallOf(3, stableCardsOf(4), townNeed)).toEqual({
      needed: 10,
      held: 4,
      standing: 'stable',
    })
  })

  it('counts only the retained words toward a retained need', () => {
    const cards = [...stableCardsOf(30), ...retainedCardsOf(20)]

    expect(wordShortfallOf(7, cards, townNeed)).toEqual({
      needed: 50,
      held: 20,
      standing: 'retained',
    })
  })

  it('finds no shortfall once the held words meet the need', () => {
    expect(wordShortfallOf(3, stableCardsOf(10), townNeed)).toBeNull()
  })
})
