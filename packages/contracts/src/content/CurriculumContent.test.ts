import { describe, expect, it } from 'vitest'
import { CurriculumContentSchema } from '../index'

const curriculum = {
  chromeLessonCount: 1,
  lessonIds: ['lesson-1'],
  skill: { resource: 'money', ratePercent: 5 },
  keepGoing: { wordsPerRead: 10, secondsBeforeDue: 86_400 },
}

describe('CurriculumContentSchema', () => {
  it('parses the lessons in order with the chrome count, the skill and the Keep going terms', () => {
    expect(CurriculumContentSchema.parse(curriculum)).toEqual(curriculum)
  })

  it('rejects a skill on a resource the game does not have', () => {
    const skill = { resource: 'wisdom', ratePercent: 5 }

    expect(CurriculumContentSchema.safeParse({ ...curriculum, skill }).success).toBe(false)
  })

  it('rejects a skill that keeps the cycle', () => {
    const skill = { cycle: ['food', 'material', 'power', 'money'], ratePercent: 5 }

    expect(CurriculumContentSchema.safeParse({ ...curriculum, skill }).success).toBe(false)
  })

  it('rejects a curriculum of no lesson', () => {
    expect(CurriculumContentSchema.safeParse({ ...curriculum, lessonIds: [] }).success).toBe(false)
  })

  it('rejects a Keep going read of no word', () => {
    const keepGoing = { wordsPerRead: 0, secondsBeforeDue: 86_400 }

    expect(CurriculumContentSchema.safeParse({ ...curriculum, keepGoing }).success).toBe(false)
  })

  it('rejects a key the curriculum does not know', () => {
    expect(CurriculumContentSchema.safeParse({ ...curriculum, bands: 3 }).success).toBe(false)
  })
})
