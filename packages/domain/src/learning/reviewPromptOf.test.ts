import { assert, describe, expect, it } from 'vitest'
import { MemoryCard, type StoredMemoryCard } from '../memory/MemoryCard'
import { lessonOne } from '../testing/lessonOne'
import { Instant } from '../time/Instant'
import type { HeldCard } from './HeldCard'
import type { LessonWord } from './Lesson'
import { reviewPromptOf } from './reviewPromptOf'

const enteredAt = Instant.fromEpochMilliseconds(Date.parse('2026-11-10T09:00:00Z'))

const enteredCard = MemoryCard.entered(enteredAt)

const cardInReview = (): MemoryCard => {
  const stored = {
    state: 'review',
    step: null,
    stability: 3.1,
    difficulty: 2.0975,
    lastReviewAt: Instant.fromEpochMilliseconds(Date.parse('2026-11-12T09:10:00Z')),
    lastRating: 'good',
    enteredAt,
    retainedAt: null,
  } as StoredMemoryCard
  const card = MemoryCard.restore(stored)
  assert(card.ok)
  return card.value
}

const lessonCards: ReadonlyArray<HeldCard> = lessonOne.words.map(({ id }) => ({
  wordId: id,
  card: enteredCard,
}))

const wordOfLessonOne = (id: string): LessonWord => {
  const word = lessonOne.words.find((candidate) => candidate.id === id)
  assert(word !== undefined)
  return word
}

const school = wordOfLessonOne('school')

const recognitionOfSchool = {
  lesson: lessonOne,
  word: school,
  card: enteredCard,
  shownFrame: 'I walk to school every day.',
}

const recallOfSchool = {
  ...recognitionOfSchool,
  card: cardInReview(),
  shownFrame: 'I walk to ____ every day.',
}

const offeredGlosses = (scaffold: 'es' | 'none'): ReadonlyArray<string> => {
  const prompt = reviewPromptOf(recognitionOfSchool, lessonCards, scaffold)
  assert(prompt.mode === 'recognition')
  return prompt.choices.map(({ gloss }) => gloss).sort()
}

describe('reviewPromptOf', () => {
  it('shows a recognition with the word, its frame and the glosses of the lesson under es', () => {
    const prompt = reviewPromptOf(recognitionOfSchool, lessonCards, 'es')

    assert(prompt.mode === 'recognition')
    expect({ word: prompt.word, frame: prompt.frame }).toEqual({
      word: 'school',
      frame: 'I walk to school every day.',
    })
    expect(offeredGlosses('es')).toEqual(['comida', 'dinero', 'escuela', 'hogar', 'trabajar'])
  })

  it('shows a recall with the gloss and the gapped frame under es', () => {
    expect(reviewPromptOf(recallOfSchool, lessonCards, 'es')).toEqual({
      mode: 'recall',
      gloss: 'escuela',
      gappedFrame: 'I walk to ____ every day.',
    })
  })

  it('uses definitions as recognition choices and recall cue under none', () => {
    const recall = reviewPromptOf(recallOfSchool, lessonCards, 'none')

    expect({ choices: offeredGlosses('none'), recall }).toEqual({
      choices: [
        'a place where children learn',
        'the place where you live',
        'to do a job for money',
        'what you eat',
        'what you pay with',
      ],
      recall: {
        mode: 'recall',
        gloss: 'a place where children learn',
        gappedFrame: 'I walk to ____ every day.',
      },
    })
  })
})
