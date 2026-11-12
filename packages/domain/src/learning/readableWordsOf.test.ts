import { assert, describe, expect, it } from 'vitest'
import { MemoryCard } from '../memory/MemoryCard'
import { defaultMemoryTerms } from '../memory/MemoryTerms'
import { reviewMemoryCard } from '../memory/reviewMemoryCard'
import { Instant } from '../time/Instant'
import type { HeldCard } from './HeldCard'
import type { Lesson } from './Lesson'
import { readableWordsOf } from './readableWordsOf'

const enteredAt = Instant.fromEpochMilliseconds(Date.parse('2026-11-10T09:00:00Z'))

const lesson: Lesson = {
  id: 'lesson-1',
  durationSeconds: 300,
  requiredSchoolLevel: 1,
  skill: { resource: 'food', ratePercent: 5 },
  words: ['home', 'school'].map((lemma) => ({
    id: lemma,
    acceptedForms: [lemma],
    gloss: `gloss of ${lemma}`,
    frames: [{ frame: `A frame of ${lemma}.`, gappedFrame: 'A frame of ____.' }],
  })),
}

const unreviewed = (wordId: string): HeldCard => ({
  wordId,
  card: MemoryCard.entered(enteredAt),
})

const reviewed = (wordId: string): HeldCard => {
  const card = reviewMemoryCard(
    MemoryCard.entered(enteredAt),
    'good',
    enteredAt,
    defaultMemoryTerms,
  )
  assert(card.ok)
  return { wordId, card: card.value }
}

const idsOf = (words: ReturnType<typeof readableWordsOf>): ReadonlyArray<string> =>
  words.map(({ id }) => id)

describe('readableWordsOf', () => {
  it('reads every word of a running lesson', () => {
    expect(idsOf(readableWordsOf(lesson, [], [], true))).toEqual(['home', 'school'])
  })

  it('reads nothing of a lesson with no card and no running slot', () => {
    expect(readableWordsOf(lesson, [], [], false)).toEqual([])
  })

  it('reads a word whose card has no review', () => {
    expect(idsOf(readableWordsOf(lesson, [], [unreviewed('school')], false))).toEqual(['school'])
  })

  it('stops reading a word at its first review, even on a running lesson', () => {
    expect(idsOf(readableWordsOf(lesson, [], [reviewed('home')], true))).toEqual(['school'])
  })

  it('never reads a held-out word', () => {
    const cards = [unreviewed('home'), unreviewed('school')]

    expect(idsOf(readableWordsOf(lesson, ['home'], cards, false))).toEqual(['school'])
  })
})
