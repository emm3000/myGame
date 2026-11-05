import { assert, describe, expect, it } from 'vitest'
import { MemoryCard } from '../memory/MemoryCard'
import { lessonOne } from '../testing/lessonOne'
import { Instant } from '../time/Instant'
import type { HeldCard } from './HeldCard'
import { isLessonRetained } from './isLessonRetained'

const reviewedAt = Instant.fromEpochMilliseconds(Date.parse('2026-11-23T09:10:00Z'))

const enteredAt = Instant.fromEpochMilliseconds(Date.parse('2026-11-10T09:00:00Z'))

const retainedCardOf = (wordId: string): HeldCard => {
  const card = MemoryCard.restore({
    state: 'review',
    step: null,
    stability: 7,
    difficulty: 2.0975,
    lastReviewAt: reviewedAt,
    lastRating: 'good',
    enteredAt,
    retainedAt: reviewedAt,
  })
  assert(card.ok)
  return { wordId, card: card.value }
}

const unretainedCardOf = (wordId: string): HeldCard => ({
  wordId,
  card: MemoryCard.entered(enteredAt),
})

describe('isLessonRetained', () => {
  it('earns the skill on the words the player holds, and at least one', () => {
    const allButHeldOutMoney = ['home', 'school', 'work', 'food'].map(retainedCardOf)

    expect(isLessonRetained(lessonOne, allButHeldOutMoney)).toBe(true)
  })

  it('waits on every word the player holds', () => {
    const cards = [...['home', 'school', 'work'].map(retainedCardOf), unretainedCardOf('food')]

    expect(isLessonRetained(lessonOne, cards)).toBe(false)
  })

  it('earns no skill for a lesson whose every word is held out', () => {
    const cardsOfAnotherLesson = [retainedCardOf('town')]

    expect(isLessonRetained(lessonOne, cardsOfAnotherLesson)).toBe(false)
  })

  it('waits on a released word once the player holds its card', () => {
    const cards = [
      ...['home', 'school', 'work', 'food'].map(retainedCardOf),
      unretainedCardOf('money'),
    ]

    expect(isLessonRetained(lessonOne, cards)).toBe(false)
  })
})
