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

const went = { lemma: 'go', past: 'went', pastParticiple: 'gone' }

describe('GrammarContentSchema', () => {
  it('parses every structure with its level, frame words, inflections and admitting lesson', () => {
    const grammar = { structures: [presentOfBe, pastSimple], irregularVerbs: [] }

    expect(GrammarContentSchema.parse(grammar)).toEqual(grammar)
  })

  it('rejects a structure above Pre-A1 without its CEFR-J item', () => {
    const { cefrjItem: _, ...withoutItem } = presentOfBe

    expect(
      GrammarContentSchema.safeParse({ structures: [withoutItem], irregularVerbs: [] }).success,
    ).toBe(false)
  })

  it('parses a Pre-A1 structure the CEFR-J Grammar Profile lists no item for', () => {
    const { cefrjItem: _, ...nounPlurals } = {
      ...presentOfBe,
      name: 'Noun plurals',
      cefr: 'Pre-A1',
    }
    const grammar = { structures: [nounPlurals], irregularVerbs: [] }

    expect(GrammarContentSchema.parse(grammar)).toEqual(grammar)
  })

  it('parses an irregular verb with its past and its past participle', () => {
    const grammar = { structures: [pastSimple], irregularVerbs: [went] }

    expect(GrammarContentSchema.parse(grammar)).toEqual(grammar)
  })

  it('rejects an irregular verb without its past participle', () => {
    const { pastParticiple: _, ...withoutParticiple } = went

    expect(
      GrammarContentSchema.safeParse({
        structures: [pastSimple],
        irregularVerbs: [withoutParticiple],
      }).success,
    ).toBe(false)
  })

  it('rejects a structure without its admitting lesson', () => {
    const { admittingLessonId: _, ...withoutLesson } = presentOfBe

    expect(
      GrammarContentSchema.safeParse({ structures: [withoutLesson], irregularVerbs: [] }).success,
    ).toBe(false)
  })

  it('rejects a level outside the CEFR-J levels', () => {
    const structures = [{ ...presentOfBe, cefr: 'A1' }]

    expect(GrammarContentSchema.safeParse({ structures, irregularVerbs: [] }).success).toBe(false)
  })

  it('rejects an inventory of no structure', () => {
    expect(GrammarContentSchema.safeParse({ structures: [], irregularVerbs: [] }).success).toBe(
      false,
    )
  })
})
