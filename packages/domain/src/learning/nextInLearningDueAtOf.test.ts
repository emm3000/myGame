import { assert, describe, expect, it } from 'vitest'
import { MemoryCard } from '../memory/MemoryCard'
import { defaultMemoryTerms } from '../memory/MemoryTerms'
import { Instant } from '../time/Instant'
import type { HeldCard } from './HeldCard'
import { nextInLearningDueAtOf } from './nextInLearningDueAtOf'

const instantOf = (iso: string): Instant => Instant.fromEpochMilliseconds(Date.parse(iso))

const enteredAt = instantOf('2026-11-10T09:00:00Z')

const relearningAt = (wordId: string, stability: number, lastReviewAt: string): HeldCard => {
  const card = MemoryCard.restore({
    state: 'relearning',
    step: 0,
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
})
