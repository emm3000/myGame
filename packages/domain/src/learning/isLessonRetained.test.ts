import { assert, describe, expect, it } from 'vitest'
import { MemoryCard, type StoredMemoryCard } from '../memory/MemoryCard'
import { Instant } from '../time/Instant'
import { isWordRetained } from './isLessonRetained'

const reviewedAt = Instant.fromEpochMilliseconds(Date.parse('2026-11-23T09:10:00Z'))

const enteredAt = Instant.fromEpochMilliseconds(Date.parse('2026-11-10T09:00:00Z'))

const reviewedCard = (stability: number, retainedAt: Instant | null): MemoryCard => {
  const stored: StoredMemoryCard = {
    state: 'review',
    step: null,
    stability,
    difficulty: 2.0975,
    lastReviewAt: reviewedAt,
    lastRating: 'good',
    enteredAt,
    retainedAt,
  }
  const card = MemoryCard.restore(stored)
  assert(card.ok)
  return card.value
}

describe('isWordRetained', () => {
  it('holds a word recalled unaided a week after its last review at a stability of 7', () => {
    expect(isWordRetained({ wordId: 'school', card: reviewedCard(7, reviewedAt) })).toBe(true)
  })

  it('refuses a word whose stability crossed 7 without the unaided recall', () => {
    expect(isWordRetained({ wordId: 'school', card: reviewedCard(10.971, null) })).toBe(false)
  })

  it('refuses a word retained below a stability of 7', () => {
    expect(isWordRetained({ wordId: 'school', card: reviewedCard(6.99, reviewedAt) })).toBe(false)
  })

  it('refuses a word whose card just entered', () => {
    expect(isWordRetained({ wordId: 'school', card: MemoryCard.entered(enteredAt) })).toBe(false)
  })
})
