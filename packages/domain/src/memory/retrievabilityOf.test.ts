import { assert, describe, expect, it } from 'vitest'
import { Instant } from '../time/Instant'
import { MemoryCard } from './MemoryCard'
import { defaultMemoryTerms } from './MemoryTerms'
import { retrievabilityOf } from './retrievabilityOf'

const MILLISECONDS_PER_DAY = 86_400_000

const lastReviewAt = Instant.fromEpochMilliseconds(1_669_725_000_000)

const millisecondsAfterReview = (milliseconds: number): Instant =>
  Instant.fromEpochMilliseconds(lastReviewAt.epochMilliseconds + milliseconds)

const reviewCardOfStabilityTen = (): MemoryCard => {
  const card = MemoryCard.restore({
    state: 'review',
    step: null,
    stability: 10,
    difficulty: 5,
    lastReviewAt,
    lastRating: 'good',
    enteredAt: lastReviewAt,
    retainedAt: null,
  })
  assert(card.ok)
  return card.value
}

describe('retrievabilityOf', () => {
  it('reads 0 on a card never reviewed, as py-fsrs 6.3.2 test_retrievability', () => {
    expect(
      retrievabilityOf(MemoryCard.entered(lastReviewAt), lastReviewAt, defaultMemoryTerms),
    ).toBe(0)
  })

  it('reads 1 on the day of the last review', () => {
    expect(retrievabilityOf(reviewCardOfStabilityTen(), lastReviewAt, defaultMemoryTerms)).toBe(1)
  })

  it('reads 0.9 once the whole days elapsed equal the stability', () => {
    const tenDaysLater = millisecondsAfterReview(10 * MILLISECONDS_PER_DAY)

    expect(
      retrievabilityOf(reviewCardOfStabilityTen(), tenDaysLater, defaultMemoryTerms),
    ).toBeCloseTo(0.9, 12)
  })

  it('holds its value until a whole day more has elapsed', () => {
    const card = reviewCardOfStabilityTen()
    const ninthDay = millisecondsAfterReview(9 * MILLISECONDS_PER_DAY)
    const lastMillisecondOfNinthDay = millisecondsAfterReview(10 * MILLISECONDS_PER_DAY - 1)

    expect(retrievabilityOf(card, lastMillisecondOfNinthDay, defaultMemoryTerms)).toBe(
      retrievabilityOf(card, ninthDay, defaultMemoryTerms),
    )
  })

  it('falls as the days pass', () => {
    const card = reviewCardOfStabilityTen()

    expect(
      retrievabilityOf(
        card,
        millisecondsAfterReview(20 * MILLISECONDS_PER_DAY),
        defaultMemoryTerms,
      ),
    ).toBeLessThan(
      retrievabilityOf(
        card,
        millisecondsAfterReview(10 * MILLISECONDS_PER_DAY),
        defaultMemoryTerms,
      ),
    )
  })
})
