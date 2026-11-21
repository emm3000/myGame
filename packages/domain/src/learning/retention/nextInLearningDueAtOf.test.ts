import { assert, describe, expect, it } from 'vitest'
import { MemoryCard } from '../../memory/MemoryCard'
import { defaultMemoryTerms } from '../../memory/MemoryTerms'
import { Instant } from '../../time/Instant'
import type { HeldCard } from '../HeldCard'
import { nextInLearningDueAtOf } from './nextInLearningDueAtOf'

const instantOf = (iso: string): Instant => Instant.fromEpochMilliseconds(Date.parse(iso))

const enteredAt = instantOf('2026-11-10T09:00:00Z')

const relearningAtStep = (
  wordId: string,
  step: number,
  stability: number,
  lastReviewAt: string,
): HeldCard => {
  const card = MemoryCard.restore({
    state: 'relearning',
    step,
    stability,
    difficulty: 5,
    lastReviewAt: instantOf(lastReviewAt),
    lastRating: 'again',
    enteredAt,
    retainedAt: null,
  })
  assert(card.ok)
  return { wordId, card: card.value }
}

const relearningAt = (wordId: string, stability: number, lastReviewAt: string): HeldCard =>
  relearningAtStep(wordId, 0, stability, lastReviewAt)

const reviewAt = (wordId: string, stability: number, lastReviewAt: string): HeldCard => {
  const card = MemoryCard.restore({
    state: 'review',
    step: null,
    stability,
    difficulty: 5,
    lastReviewAt: instantOf(lastReviewAt),
    lastRating: 'good',
    enteredAt,
    retainedAt: null,
  })
  assert(card.ok)
  return { wordId, card: card.value }
}

const unreviewed = (wordId: string): HeldCard => ({ wordId, card: MemoryCard.entered(enteredAt) })

const dueAtOf = (cards: ReadonlyArray<HeldCard>): string | null => {
  const next = nextInLearningDueAtOf(cards, defaultMemoryTerms)
  assert(next.ok)
  return next.value === null ? null : new Date(next.value.epochMilliseconds).toISOString()
}

describe('nextInLearningDueAtOf', () => {
  it('answers the earliest due instant among the cards in learning', () => {
    const cards = [
      relearningAt('school', 3.5, '2026-11-20T09:30:00.000Z'),
      relearningAt('home', 2.3, '2026-11-20T09:05:00.000Z'),
      relearningAt('work', 1.2, '2026-11-20T09:20:00.000Z'),
    ]

    expect(dueAtOf(cards)).toBe('2026-11-20T09:15:00.000Z')
  })

  it('skips a card at 4 days or more even when it is due sooner', () => {
    const cards = [
      relearningAt('money', 4, '2026-11-20T08:00:00.000Z'),
      relearningAt('home', 3.99, '2026-11-20T09:05:00.000Z'),
    ]

    expect(dueAtOf(cards)).toBe('2026-11-20T09:15:00.000Z')
  })

  it('answers null with no card in learning', () => {
    const cards = [
      relearningAt('money', 4, '2026-11-20T08:00:00.000Z'),
      relearningAt('food', 6.0539, '2026-11-20T08:30:00.000Z'),
    ]

    expect(dueAtOf(cards)).toBeNull()
  })

  it('answers an overdue card’s instant even though it is in the past', () => {
    const readAt = instantOf('2026-11-20T12:00:00.000Z')
    const overdueCard = relearningAt('home', 2.3, '2026-11-12T09:05:00.000Z')
    const laterCard = relearningAt('work', 1.2, '2026-11-20T11:55:00.000Z')

    const dueAt = dueAtOf([laterCard, overdueCard])

    expect(dueAt).toBe('2026-11-12T09:15:00.000Z')
    expect(Date.parse(dueAt ?? '')).toBeLessThan(readAt.epochMilliseconds)
  })

  it('counts a review card under 4 days as in learning', () => {
    const reviewCard = reviewAt('school', 2.3, '2026-11-20T08:00:00.000Z')
    const relearningCard = relearningAt('home', 1.2, '2026-11-25T09:05:00.000Z')

    expect(dueAtOf([relearningCard, reviewCard])).toBe('2026-11-22T08:00:00.000Z')
  })

  it('answers an unreviewed card’s entered instant', () => {
    const unreviewedCard = unreviewed('house')
    const relearningCard = relearningAt('home', 1.2, '2026-11-20T09:05:00.000Z')

    expect(dueAtOf([relearningCard, unreviewedCard])).toBe('2026-11-10T09:00:00.000Z')
  })

  it('passes up the error of a card at a step its state does not have', () => {
    const dueCard = relearningAt('home', 1.2, '2026-11-20T09:05:00.000Z')
    const strayStepCard = relearningAtStep('work', 1, 2.3, '2026-11-20T09:20:00.000Z')

    const next = nextInLearningDueAtOf([dueCard, strayStepCard], defaultMemoryTerms)

    expect(next).toEqual({
      ok: false,
      error: { kind: 'UnknownMemoryStep', state: 'relearning', step: 1 },
    })
  })
})
