import { assert, describe, expect, it } from 'vitest'
import { Instant } from '../time/Instant'
import { dueInstantOf } from './dueInstantOf'
import { MemoryCard } from './MemoryCard'
import type { MemoryRating } from './MemoryRating'
import { defaultMemoryTerms } from './MemoryTerms'
import { reviewMemoryCard } from './reviewMemoryCard'

const MILLISECONDS_PER_DAY = 86_400_000

const pyFsrsStart = Instant.fromEpochMilliseconds(1_669_725_000_000)

const daysAfterStart = (days: number): Instant =>
  Instant.fromEpochMilliseconds(pyFsrsStart.epochMilliseconds + days * MILLISECONDS_PER_DAY)

type TimedRating = { readonly rating: MemoryRating; readonly at: Instant }

const reviewedInOrder = (reviews: ReadonlyArray<TimedRating>): MemoryCard =>
  reviews.reduce((card, { rating, at }) => {
    const next = reviewMemoryCard(card, rating, at, defaultMemoryTerms)
    assert(next.ok)
    return next.value
  }, MemoryCard.entered(pyFsrsStart))

const twoLearningGoods: ReadonlyArray<TimedRating> = [
  { rating: 'good', at: daysAfterStart(0) },
  { rating: 'good', at: daysAfterStart(0) },
]

const relearningCard = (): MemoryCard => {
  const card = MemoryCard.restore({
    state: 'relearning',
    step: 0,
    stability: 0.6077,
    difficulty: 5,
    lastReviewAt: daysAfterStart(0),
    lastRating: 'again',
    enteredAt: pyFsrsStart,
    retainedAt: null,
  })
  assert(card.ok)
  return card.value
}

describe('reviewMemoryCard', () => {
  it('reaches the stability and difficulty of py-fsrs 6.3.2 test_memo_state', () => {
    const memoStateReviews: ReadonlyArray<TimedRating> = [
      { rating: 'again', at: daysAfterStart(0) },
      { rating: 'good', at: daysAfterStart(0) },
      { rating: 'good', at: daysAfterStart(1) },
      { rating: 'good', at: daysAfterStart(4) },
      { rating: 'good', at: daysAfterStart(12) },
      { rating: 'good', at: daysAfterStart(33) },
    ]

    const card = reviewedInOrder(memoStateReviews).stored

    assert(card.stability !== null)
    expect(Math.abs(card.stability - 53.62691)).toBeLessThanOrEqual(1e-4)
    expect(Math.abs(card.difficulty - 6.3574867)).toBeLessThanOrEqual(1e-4)
  })

  it('brings difficulty down to 1.0 as in py-fsrs 6.3.2 test_repeated_correct_reviews', () => {
    const easyReviewsOneMillisecondApart = Array.from({ length: 10 }, (_, index) => ({
      rating: 'easy' as const,
      at: Instant.fromEpochMilliseconds(pyFsrsStart.epochMilliseconds + index),
    }))

    const card = reviewedInOrder(easyReviewsOneMillisecondApart).stored

    assert(card.stability !== null)
    expect(card.difficulty).toBe(1)
  })

  it('refuses a review before the last review of the card', () => {
    const reviewed = reviewedInOrder([{ rating: 'good', at: daysAfterStart(1) }])
    const earlier = daysAfterStart(0)

    expect(reviewMemoryCard(reviewed, 'good', earlier, defaultMemoryTerms)).toEqual({
      ok: false,
      error: {
        kind: 'ReviewBeforeLastReview',
        lastReviewAt: daysAfterStart(1),
        reviewedAt: earlier,
      },
    })
  })

  it('schedules an overdue Good from its elapsed time, raising stability above an on-time Good', () => {
    const inReview = reviewedInOrder(twoLearningGoods)
    const dueAt = dueInstantOf(inReview, defaultMemoryTerms)
    assert(dueAt.ok)

    const onTime = reviewMemoryCard(inReview, 'good', dueAt.value, defaultMemoryTerms)
    const overdue = reviewMemoryCard(
      inReview,
      'good',
      Instant.fromEpochMilliseconds(dueAt.value.epochMilliseconds + 30 * MILLISECONDS_PER_DAY),
      defaultMemoryTerms,
    )

    assert(onTime.ok && overdue.ok)
    assert(onTime.value.stored.stability !== null && overdue.value.stored.stability !== null)
    expect(overdue.value.stored.stability).toBeGreaterThan(onTime.value.stored.stability)
  })

  it('carries the entry instant through every review', () => {
    expect(reviewedInOrder(twoLearningGoods).stored.enteredAt).toEqual(pyFsrsStart)
  })

  it('marks a Good recall 7 whole days after the review before it as retained at its instant', () => {
    const recalledAt = daysAfterStart(7)

    const card = reviewedInOrder([...twoLearningGoods, { rating: 'good', at: recalledAt }])

    expect(card.stored.retainedAt).toEqual(recalledAt)
  })

  it('leaves a Good recall under 7 whole days after the review before it unretained', () => {
    const card = reviewedInOrder([
      ...twoLearningGoods,
      {
        rating: 'good',
        at: Instant.fromEpochMilliseconds(daysAfterStart(7).epochMilliseconds - 1),
      },
    ])

    expect(card.stored.retainedAt).toBeNull()
  })

  it('leaves a Hard recall 7 days after the review before it unretained', () => {
    const card = reviewedInOrder([...twoLearningGoods, { rating: 'hard', at: daysAfterStart(7) }])

    expect(card.stored.retainedAt).toBeNull()
  })

  it('leaves a Good recognition in learning unretained, even a week late', () => {
    const card = reviewedInOrder([
      { rating: 'good', at: daysAfterStart(0) },
      { rating: 'good', at: daysAfterStart(7) },
    ])

    expect(card.stored.retainedAt).toBeNull()
  })

  it('marks a Good recall in relearning 7 whole days after its last review as retained at its instant', () => {
    const recalledAt = daysAfterStart(7)

    const retained = reviewMemoryCard(relearningCard(), 'good', recalledAt, defaultMemoryTerms)

    assert(retained.ok)
    expect(retained.value.stored.retainedAt).toEqual(recalledAt)
  })

  it('leaves a Good recall in relearning under 7 whole days after its last review unretained', () => {
    const justShortOfAWeek = Instant.fromEpochMilliseconds(daysAfterStart(7).epochMilliseconds - 1)

    const unretained = reviewMemoryCard(
      relearningCard(),
      'good',
      justShortOfAWeek,
      defaultMemoryTerms,
    )

    assert(unretained.ok)
    expect(unretained.value.stored.retainedAt).toBeNull()
  })

  it('clears a retained instant at the next review that is not a late Good recall', () => {
    const card = reviewedInOrder([
      ...twoLearningGoods,
      { rating: 'good', at: daysAfterStart(7) },
      { rating: 'good', at: daysAfterStart(8) },
    ])

    expect(card.stored.retainedAt).toBeNull()
  })
})
