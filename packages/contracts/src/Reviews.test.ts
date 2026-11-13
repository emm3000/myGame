import { describe, expect, it } from 'vitest'
import { ReviewsSchema } from './index'

const recognitionOfHome = {
  mode: 'recognition',
  wordId: 'lesson-1-1',
  lessonId: 'lesson-1',
  dueAt: '2026-11-10T09:00:00.000Z',
  word: 'home',
  frame: [
    { text: 'We have a new ', support: null },
    { text: 'home', support: null },
    { text: ' in this ', support: null },
    { text: 'town', support: { shown: 'beside', text: 'pueblo', language: 'es' } },
    { text: '.', support: null },
  ],
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
  gappedFrame: [
    { text: 'I walk to ____ every ', support: null },
    { text: 'day', support: { shown: 'onTap', text: 'día', language: 'es' } },
    { text: '.', support: null },
  ],
}

const readAt = '2026-11-12T09:00:00.000Z'

describe('ReviewsSchema', () => {
  it('parses the due reviews of each mode', () => {
    const reviews = {
      due: [recognitionOfHome, recallOfSchool],
      readFirst: ['lesson-1'],
      nextDueAt: null,
      readAt,
    }

    expect(ReviewsSchema.parse(reviews)).toEqual(reviews)
  })

  it('parses the next due instant when nothing is due', () => {
    const reviews = { due: [], readFirst: [], nextDueAt: '2026-11-12T09:10:00.000Z', readAt }

    expect(ReviewsSchema.parse(reviews)).toEqual(reviews)
  })

  it('rejects a recognition choice that names its word id', () => {
    const choices = [{ choiceId: '5c0e91a2', wordId: 'lesson-1-4', gloss: 'dinero' }]

    expect(
      ReviewsSchema.safeParse({
        due: [{ ...recognitionOfHome, choices }],
        readFirst: [],
        nextDueAt: null,
        readAt,
      }).success,
    ).toBe(false)
  })

  it('rejects a recall review that carries its word', () => {
    expect(
      ReviewsSchema.safeParse({
        due: [{ ...recallOfSchool, word: 'school' }],
        readFirst: [],
        nextDueAt: null,
        readAt,
      }).success,
    ).toBe(false)
  })

  it('rejects a recognition whose frame holds no span', () => {
    expect(
      ReviewsSchema.safeParse({
        due: [{ ...recognitionOfHome, frame: [] }],
        readFirst: [],
        nextDueAt: null,
        readAt,
      }).success,
    ).toBe(false)
  })

  it('rejects a recall whose gapped frame is a plain string', () => {
    expect(
      ReviewsSchema.safeParse({
        due: [{ ...recallOfSchool, gappedFrame: 'I walk to ____ every day.' }],
        readFirst: [],
        nextDueAt: null,
        readAt,
      }).success,
    ).toBe(false)
  })

  it('rejects a span with no text', () => {
    const frame = [{ text: '', support: null }]

    expect(
      ReviewsSchema.safeParse({
        due: [{ ...recognitionOfHome, frame }],
        readFirst: [],
        nextDueAt: null,
        readAt,
      }).success,
    ).toBe(false)
  })

  it('rejects a span carrying a field it does not define', () => {
    const frame = [{ text: 'We have a new home.', support: null, wordId: 'lesson-1-1' }]

    expect(
      ReviewsSchema.safeParse({
        due: [{ ...recognitionOfHome, frame }],
        readFirst: [],
        nextDueAt: null,
        readAt,
      }).success,
    ).toBe(false)
  })

  it('rejects reviews that name no instant they were read at', () => {
    expect(ReviewsSchema.safeParse({ due: [], readFirst: [], nextDueAt: null }).success).toBe(false)
  })

  it('rejects reviews that name no lessons to read first', () => {
    expect(ReviewsSchema.safeParse({ due: [], nextDueAt: null, readAt }).success).toBe(false)
  })

  it('rejects a blank lesson to read first', () => {
    expect(
      ReviewsSchema.safeParse({ due: [], readFirst: [''], nextDueAt: null, readAt }).success,
    ).toBe(false)
  })

  it('rejects reviews carrying a field they do not define', () => {
    expect(
      ReviewsSchema.safeParse({ due: [], readFirst: [], nextDueAt: null, readAt, town: {} })
        .success,
    ).toBe(false)
  })
})
