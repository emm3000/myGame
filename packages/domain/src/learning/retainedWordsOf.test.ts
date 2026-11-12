import { assert, describe, expect, it } from 'vitest'
import { MemoryCard } from '../memory/MemoryCard'
import { lessonOne } from '../testing/lessonOne'
import { Instant } from '../time/Instant'
import type { HeldCard } from './HeldCard'
import type { Lesson, LessonWord } from './Lesson'
import { retainedWordsOf } from './retainedWordsOf'

const reviewedAt = Instant.fromEpochMilliseconds(Date.parse('2026-11-23T09:10:00Z'))

const enteredAt = Instant.fromEpochMilliseconds(Date.parse('2026-11-10T09:00:00Z'))

const wordOf = (id: string): LessonWord => ({
  id,
  acceptedForms: [id],
  gloss: id,
  frames: [{ frame: `The ${id} is new.`, gappedFrame: 'The ____ is new.' }],
})

const lessonTwo: Lesson = {
  ...lessonOne,
  id: 'lesson-2',
  words: [wordOf('town'), wordOf('farm')],
}

const shelf = [lessonOne, lessonTwo]

const earnedLessonOne = [{ lessonId: lessonOne.id }]

const reviewedCardOf = (wordId: string, retainedAtOfCard: Instant | null): HeldCard => {
  const card = MemoryCard.restore({
    state: 'review',
    step: null,
    stability: 7,
    difficulty: 2.0975,
    lastReviewAt: reviewedAt,
    lastRating: 'good',
    enteredAt,
    retainedAt: retainedAtOfCard,
  })
  assert(card.ok)
  return { wordId, card: card.value }
}

const retainedCardOf = (wordId: string): HeldCard => reviewedCardOf(wordId, reviewedAt)

const enteredCardOf = (wordId: string): HeldCard => ({
  wordId,
  card: MemoryCard.entered(enteredAt),
})

describe('retainedWordsOf', () => {
  it('counts the retained words of the first lesson with no earned skill', () => {
    const cards = [
      ...['home', 'school', 'work'].map(retainedCardOf),
      ...['money', 'food'].map(enteredCardOf),
    ]

    expect(retainedWordsOf(shelf, [], cards)).toEqual({ count: 3, total: 5 })
  })

  it('counts among the words the player holds', () => {
    const cards = [retainedCardOf('home'), enteredCardOf('school'), enteredCardOf('work')]

    expect(retainedWordsOf(shelf, [], cards)).toEqual({ count: 1, total: 3 })
  })

  it('leaves a held-out word out of the total', () => {
    const allButHeldOutMoney = ['home', 'school', 'work', 'food'].map(retainedCardOf)

    expect(retainedWordsOf(shelf, [], allButHeldOutMoney)).toEqual({ count: 4, total: 4 })
  })

  it('falls back when a later answer clears retainedAt', () => {
    const cards = [
      ...['home', 'school'].map(retainedCardOf),
      reviewedCardOf('work', null),
      ...['money', 'food'].map(enteredCardOf),
    ]

    expect(retainedWordsOf(shelf, [], cards)).toEqual({ count: 2, total: 5 })
  })

  it('moves on to the next lesson once a skill is earned', () => {
    const cards = [
      ...lessonOne.words.map(({ id }) => retainedCardOf(id)),
      retainedCardOf('town'),
      enteredCardOf('farm'),
    ]

    expect(retainedWordsOf(shelf, earnedLessonOne, cards)).toEqual({ count: 1, total: 2 })
  })

  it('answers null when no lesson is left to count', () => {
    const everySkill = shelf.map(({ id }) => ({ lessonId: id }))

    expect(retainedWordsOf(shelf, everySkill, [retainedCardOf('home')])).toBeNull()
  })

  it('answers null while the player holds no word of the lesson to count', () => {
    const cardsOfLessonOne = lessonOne.words.map(({ id }) => retainedCardOf(id))

    expect(retainedWordsOf(shelf, earnedLessonOne, cardsOfLessonOne)).toBeNull()
  })
})
