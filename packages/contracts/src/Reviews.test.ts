import { describe, expect, it } from 'vitest'
import { ReviewsSchema } from './index'

const recognitionOfHome = {
  mode: 'recognition',
  wordId: 'lesson-1-1',
  lessonId: 'lesson-1',
  dueAt: '2026-11-10T09:00:00.000Z',
  word: 'home',
  frame: 'We have a new home in this town.',
  choices: [
    { choiceId: '5c0e91a2', gloss: 'dinero' },
    { choiceId: 'e17b3f08', gloss: 'hogar' },
  ],
}

const recallOfSchool = {
  mode: 'recall',
  wordId: 'lesson-1-2',
  lessonId: 'lesson-1',
  dueAt: '2026-11-12T09:10:00.000Z',
  gloss: 'escuela',
  gappedFrame: 'I walk to ____ every day.',
}

describe('ReviewsSchema', () => {
  it('parses the due reviews of each mode', () => {
    const reviews = { due: [recognitionOfHome, recallOfSchool], nextDueAt: null }

    expect(ReviewsSchema.parse(reviews)).toEqual(reviews)
  })

  it('parses the next due instant when nothing is due', () => {
    const reviews = { due: [], nextDueAt: '2026-11-12T09:10:00.000Z' }

    expect(ReviewsSchema.parse(reviews)).toEqual(reviews)
  })

  it('rejects a recognition choice that names its word id', () => {
    const choices = [{ choiceId: '5c0e91a2', wordId: 'lesson-1-4', gloss: 'dinero' }]

    expect(
      ReviewsSchema.safeParse({ due: [{ ...recognitionOfHome, choices }], nextDueAt: null })
        .success,
    ).toBe(false)
  })

  it('rejects a recall review that carries its word', () => {
    expect(
      ReviewsSchema.safeParse({ due: [{ ...recallOfSchool, word: 'school' }], nextDueAt: null })
        .success,
    ).toBe(false)
  })

  it('rejects reviews that carry a fief', () => {
    expect(ReviewsSchema.safeParse({ due: [], nextDueAt: null, fief: {} }).success).toBe(false)
  })
})
