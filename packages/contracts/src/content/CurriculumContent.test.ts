import { describe, expect, it } from 'vitest'
import { CurriculumContentSchema } from '../index'

const curriculum = {
  chromeLessonCount: 1,
  lessonIds: ['lesson-1'],
  skill: { resource: 'money', ratePercent: 5 },
}

describe('CurriculumContentSchema', () => {
  it('parses the lessons in order with the chrome count and the skill', () => {
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

  it('rejects a key the curriculum does not know', () => {
    expect(CurriculumContentSchema.safeParse({ ...curriculum, bands: 3 }).success).toBe(false)
  })
})
