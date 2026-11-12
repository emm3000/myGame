import { assert, describe, expect, it } from 'vitest'
import { MemoryCard } from '../memory/MemoryCard'
import { defaultMemoryTerms } from '../memory/MemoryTerms'
import { reviewMemoryCard } from '../memory/reviewMemoryCard'
import { Instant } from '../time/Instant'
import { type DueCard, dueCardsAt } from './dueCardsAt'
import type { HeldCard } from './HeldCard'
import type { Lesson } from './Lesson'
import { readFirstOf } from './readFirstOf'

const instantAt = (iso: string): Instant => Instant.fromEpochMilliseconds(Date.parse(iso))

const finishedAt = instantAt('2026-11-10T09:00:00Z')
const readAt = instantAt('2026-11-10T09:30:00Z')

const lessonOf = (id: string, wordIds: ReadonlyArray<string>): Lesson => ({
  id,
  durationSeconds: 300,
  requiredSchoolLevel: 1,
  skill: { resource: 'food', ratePercent: 5 },
  words: wordIds.map((wordId) => ({
    id: wordId,
    acceptedForms: [wordId],
    gloss: `gloss of ${wordId}`,
    frames: [{ frame: `A frame of ${wordId}.`, gappedFrame: 'A frame of ____.' }],
  })),
})

const curriculum = [
  lessonOf('lesson-1', ['first-a', 'first-b']),
  lessonOf('lesson-2', ['second-a']),
  lessonOf('lesson-3', ['third-a']),
]

const unreviewed = (wordId: string, enteredAt = finishedAt): HeldCard => ({
  wordId,
  card: MemoryCard.entered(enteredAt),
})

const reviewed = (wordId: string): HeldCard => {
  const card = reviewMemoryCard(
    MemoryCard.entered(finishedAt),
    'again',
    finishedAt,
    defaultMemoryTerms,
  )
  assert(card.ok)
  return { wordId, card: card.value }
}

const dueOf = (cards: ReadonlyArray<HeldCard>): ReadonlyArray<DueCard> => {
  const due = dueCardsAt(cards, readAt, defaultMemoryTerms)
  assert(due.ok)
  return due.value
}

describe('readFirstOf', () => {
  it('lists every lesson with an unreviewed due card in curriculum order', () => {
    const earlyFinish = instantAt('2026-11-10T08:00:00Z')
    const due = dueOf([unreviewed('third-a', earlyFinish), unreviewed('first-b')])

    expect(readFirstOf(curriculum, due)).toEqual(['lesson-1', 'lesson-3'])
  })

  it('leaves out a lesson whose due cards were all reviewed', () => {
    const due = dueOf([reviewed('first-a'), reviewed('first-b'), unreviewed('second-a')])

    expect(readFirstOf(curriculum, due)).toEqual(['lesson-2'])
  })

  it('keeps a lesson while one of its due cards is unreviewed', () => {
    const due = dueOf([reviewed('first-a'), unreviewed('first-b')])

    expect(readFirstOf(curriculum, due)).toEqual(['lesson-1'])
  })

  it('answers no lesson with no due card', () => {
    expect(readFirstOf(curriculum, [])).toEqual([])
  })
})
