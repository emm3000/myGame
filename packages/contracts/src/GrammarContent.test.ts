import { describe, expect, it } from 'vitest'
import { GrammarContentSchema } from './index'

const presentOfBe = {
  name: 'be in the present',
  cefr: 'A1.1',
  cefrjItem: '58',
  admittingLessonId: 'lesson-1',
  frameWords: ['be', 'not'],
  inflections: ['am', 'is', 'are'],
}

const pastSimple = {
  name: 'The past simple',
  cefr: 'A1.3',
  cefrjItem: '65',
  admittingLessonId: 'lesson-11',
  frameWords: [],
  inflections: ['-ed', 'did', 'had'],
}

describe('GrammarContentSchema', () => {
  it('parses every structure with its level, frame words, inflections and admitting lesson', () => {
    const grammar = { structures: [presentOfBe, pastSimple] }

    expect(GrammarContentSchema.parse(grammar)).toEqual(grammar)
  })

  it('rejects a structure without its admitting lesson', () => {
    const { admittingLessonId: _, ...withoutLesson } = presentOfBe

    expect(GrammarContentSchema.safeParse({ structures: [withoutLesson] }).success).toBe(false)
  })

  it('rejects a level outside the CEFR-J levels', () => {
    const structures = [{ ...presentOfBe, cefr: 'A1' }]

    expect(GrammarContentSchema.safeParse({ structures }).success).toBe(false)
  })

  it('rejects an inventory of no structure', () => {
    expect(GrammarContentSchema.safeParse({ structures: [] }).success).toBe(false)
  })
})
