import { describe, expect, it } from 'vitest'
import { LessonContentSchema } from './index'

const lessonOne = {
  id: 'lesson-1',
  theme: 'A day in town',
  durationSeconds: 300,
  requiredSchoolLevel: 1,
  wordIds: ['lesson-1-1', 'lesson-1-2'],
}

describe('LessonContentSchema', () => {
  it('parses a lesson with its word ids in order', () => {
    expect(LessonContentSchema.parse(lessonOne)).toEqual(lessonOne)
  })

  it('rejects a lesson that still names a library level', () => {
    const { requiredSchoolLevel: _, ...withoutSchool } = lessonOne

    expect(
      LessonContentSchema.safeParse({ ...withoutSchool, requiredLibraryLevel: 1 }).success,
    ).toBe(false)
  })

  it('rejects a lesson that names its skill', () => {
    const skill = { resource: 'food', ratePercent: 5 }

    expect(LessonContentSchema.safeParse({ ...lessonOne, skill }).success).toBe(false)
  })

  it('rejects a lesson that nests its words', () => {
    const words = [{ id: 'lesson-1-1', lemma: 'home' }]

    expect(LessonContentSchema.safeParse({ ...lessonOne, words }).success).toBe(false)
  })

  it('rejects a lesson of no word', () => {
    expect(LessonContentSchema.safeParse({ ...lessonOne, wordIds: [] }).success).toBe(false)
  })

  it('rejects a lesson of zero seconds', () => {
    expect(LessonContentSchema.safeParse({ ...lessonOne, durationSeconds: 0 }).success).toBe(false)
  })
})
