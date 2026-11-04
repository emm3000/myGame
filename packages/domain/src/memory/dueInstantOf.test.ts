import { assert, describe, expect, it } from 'vitest'
import { Instant } from '../time/Instant'
import { dueInstantOf } from './dueInstantOf'
import { MemoryCard } from './MemoryCard'
import type { MemoryRating } from './MemoryRating'
import { defaultMemoryTerms } from './MemoryTerms'
import { reviewMemoryCard } from './reviewMemoryCard'
import { wholeDaysBetween } from './wholeDaysBetween'

const MILLISECONDS_PER_DAY = 86_400_000

const pyFsrsStart = Instant.fromEpochMilliseconds(1_669_725_000_000)

const reviewedAtEachDue = (
  ratings: ReadonlyArray<MemoryRating>,
): ReadonlyArray<{ readonly reviewedAt: Instant; readonly dueAt: Instant }> => {
  let card = MemoryCard.entered(pyFsrsStart)
  return ratings.map((rating) => {
    const reviewedAt = dueInstantOf(card, defaultMemoryTerms)
    assert(reviewedAt.ok)
    const next = reviewMemoryCard(card, rating, reviewedAt.value, defaultMemoryTerms)
    assert(next.ok)
    card = next.value
    const dueAt = dueInstantOf(card, defaultMemoryTerms)
    assert(dueAt.ok)
    return { reviewedAt: reviewedAt.value, dueAt: dueAt.value }
  })
}

const reviewCardWithStability = (stability: number): MemoryCard => {
  const card = MemoryCard.restore({
    state: 'review',
    step: null,
    stability,
    difficulty: 5,
    lastReviewAt: pyFsrsStart,
    lastRating: 'good',
    enteredAt: pyFsrsStart,
    retainedAt: null,
  })
  assert(card.ok)
  return card.value
}

const dueDaysOf = (card: MemoryCard): number => {
  const dueAt = dueInstantOf(card, defaultMemoryTerms)
  assert(dueAt.ok)
  return (dueAt.value.epochMilliseconds - pyFsrsStart.epochMilliseconds) / MILLISECONDS_PER_DAY
}

describe('dueInstantOf', () => {
  it('gives the whole-day intervals of py-fsrs 6.3.2 test_review_card', () => {
    const pyFsrsReviewCardRatings: ReadonlyArray<MemoryRating> = [
      'good',
      'good',
      'good',
      'good',
      'good',
      'good',
      'again',
      'again',
      'good',
      'good',
      'good',
      'good',
      'good',
    ]

    const intervalsDays = reviewedAtEachDue(pyFsrsReviewCardRatings).map(({ reviewedAt, dueAt }) =>
      wholeDaysBetween(reviewedAt, dueAt),
    )

    expect(intervalsDays).toEqual([0, 2, 11, 46, 163, 498, 0, 0, 2, 4, 7, 12, 21])
  })

  it('makes a new card due at its entry', () => {
    expect(dueInstantOf(MemoryCard.entered(pyFsrsStart), defaultMemoryTerms)).toEqual({
      ok: true,
      value: pyFsrsStart,
    })
  })

  it('waits the mean of the first two learning steps after a Hard at step 0, as py-fsrs 6.3.2 test_hard_learning_steps', () => {
    const [hard] = reviewedAtEachDue(['hard'])

    assert(hard)
    expect(hard.dueAt.secondsSince(hard.reviewedAt)).toBe(330)
  })

  it('waits the first learning step after an Again at step 0', () => {
    const [again] = reviewedAtEachDue(['again'])

    assert(again)
    expect(again.dueAt.secondsSince(again.reviewedAt)).toBe(60)
  })

  it('waits 1.5 times the single relearning step after a Hard at step 0', () => {
    const card = MemoryCard.restore({
      state: 'relearning',
      step: 0,
      stability: 1,
      difficulty: 5,
      lastReviewAt: pyFsrsStart,
      lastRating: 'hard',
      enteredAt: pyFsrsStart,
      retainedAt: null,
    })
    assert(card.ok)

    const dueAt = dueInstantOf(card.value, defaultMemoryTerms)

    assert(dueAt.ok)
    expect(dueAt.value.secondsSince(pyFsrsStart)).toBe(900)
  })

  it('rounds a review interval of a half day to the even day, as Python round does', () => {
    expect([2.5, 3.5].map((stability) => dueDaysOf(reviewCardWithStability(stability)))).toEqual([
      2, 4,
    ])
  })

  it('schedules a review at least 1 day out', () => {
    expect(dueDaysOf(reviewCardWithStability(0.01))).toBe(1)
  })

  it('caps a review interval at the maximum interval', () => {
    expect(dueDaysOf(reviewCardWithStability(50_000))).toBe(36_500)
  })

  it('refuses a learning step the terms do not hold', () => {
    const card = MemoryCard.restore({
      state: 'learning',
      step: 2,
      stability: 1,
      difficulty: 5,
      lastReviewAt: pyFsrsStart,
      lastRating: 'good',
      enteredAt: pyFsrsStart,
      retainedAt: null,
    })
    assert(card.ok)

    expect(dueInstantOf(card.value, defaultMemoryTerms)).toEqual({
      ok: false,
      error: { kind: 'UnknownMemoryStep', state: 'learning', step: 2 },
    })
  })
})
