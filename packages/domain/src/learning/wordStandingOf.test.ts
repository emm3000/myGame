import { assert, describe, expect, it } from 'vitest'
import { MemoryCard, type StoredMemoryCard } from '../memory/MemoryCard'
import { defaultMemoryTerms } from '../memory/MemoryTerms'
import { reviewMemoryCard } from '../memory/reviewMemoryCard'
import { Instant } from '../time/Instant'
import type { HeldCard } from './HeldCard'
import { wordStandingOf } from './wordStandingOf'

const instantAt = (iso: string): Instant => Instant.fromEpochMilliseconds(Date.parse(iso))

const enteredAt = instantAt('2026-11-10T09:00:00Z')
const reviewedAt = instantAt('2026-11-12T09:10:00Z')

const heldOf = (card: MemoryCard): HeldCard => ({ wordId: 'lesson-1-2', card })

const reviewedCard = (
  placement: Pick<StoredMemoryCard, 'state' | 'step'>,
  stability: number,
  retainedAt: Instant | null,
): MemoryCard => {
  const stored = {
    ...placement,
    stability,
    difficulty: 2.0975,
    lastReviewAt: reviewedAt,
    lastRating: 'good',
    enteredAt,
    retainedAt,
  } as StoredMemoryCard
  const card = MemoryCard.restore(stored)
  assert(card.ok)
  return card.value
}

const inReview = { state: 'review', step: null } as const

describe('wordStandingOf', () => {
  it('answers notStarted with no card', () => {
    expect(wordStandingOf(undefined)).toBe('notStarted')
  })

  it('answers recognize while the card is learning', () => {
    const unreviewed = heldOf(MemoryCard.entered(enteredAt))
    const betweenSteps = heldOf(reviewedCard({ state: 'learning', step: 1 }, 2.3065, null))

    expect([wordStandingOf(unreviewed), wordStandingOf(betweenSteps)]).toEqual([
      'recognize',
      'recognize',
    ])
  })

  it('answers recall past learning under stability 7', () => {
    expect(wordStandingOf(heldOf(reviewedCard(inReview, 6.99, null)))).toBe('recall')
  })

  it('answers hold at stability 7 or more before retention', () => {
    expect(wordStandingOf(heldOf(reviewedCard(inReview, 7, null)))).toBe('hold')
  })

  it('answers retained through isWordRetained', () => {
    expect(wordStandingOf(heldOf(reviewedCard(inReview, 7, reviewedAt)))).toBe('retained')
  })

  it('moves a word back from hold to recall on a wrong recall', () => {
    const holding = reviewedCard(inReview, 10.971, null)
    const missed = reviewMemoryCard(
      holding,
      'again',
      instantAt('2026-11-23T09:10:00Z'),
      defaultMemoryTerms,
    )

    assert(missed.ok)
    expect([wordStandingOf(heldOf(holding)), wordStandingOf(heldOf(missed.value))]).toEqual([
      'hold',
      'recall',
    ])
  })
})
