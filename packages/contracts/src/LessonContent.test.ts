import { describe, expect, it } from 'vitest'
import { LessonContentSchema } from './index'

const school = {
  id: 'lesson-1-2',
  lemma: 'school',
  frame: 'I walk to school every day.',
  gappedFrame: 'I walk to ____ every day.',
  gloss: { es: 'escuela' },
}

const lessonOne = {
  id: 'lesson-1',
  theme: 'A day in town',
  durationSeconds: 300,
  requiredLibraryLevel: 1,
  skill: { resource: 'food', ratePercent: 5 },
  words: [school],
}

describe('LessonContentSchema', () => {
  it('parses a lesson with its words, frames and glosses', () => {
    expect(LessonContentSchema.parse(lessonOne)).toEqual(lessonOne)
  })

  it('rejects a word without its gapped frame', () => {
    const { gappedFrame: _, ...ungapped } = school

    expect(LessonContentSchema.safeParse({ ...lessonOne, words: [ungapped] }).success).toBe(false)
  })

  it('rejects a word without its es gloss', () => {
    const glossless = { ...school, gloss: {} }

    expect(LessonContentSchema.safeParse({ ...lessonOne, words: [glossless] }).success).toBe(false)
  })

  it('rejects a lesson of no word', () => {
    expect(LessonContentSchema.safeParse({ ...lessonOne, words: [] }).success).toBe(false)
  })

  it('rejects a key the content does not know', () => {
    expect(LessonContentSchema.safeParse({ ...lessonOne, cost: 0 }).success).toBe(false)
  })

  it('rejects a skill that raises no resource of the fief', () => {
    const skill = { resource: 'wisdom', ratePercent: 5 }

    expect(LessonContentSchema.safeParse({ ...lessonOne, skill }).success).toBe(false)
  })

  it('rejects a lesson of zero seconds', () => {
    expect(LessonContentSchema.safeParse({ ...lessonOne, durationSeconds: 0 }).success).toBe(false)
  })
})
