import { describe, expect, it } from 'vitest'
import { GrammarContentSchema } from './index'

const grammar = {
  frameWords: [
    { word: 'the', admittingLessonId: 'lesson-1' },
    { word: 'be', admittingLessonId: 'lesson-1' },
  ],
}

describe('GrammarContentSchema', () => {
  it('parses every frame word with its admitting lesson', () => {
    expect(GrammarContentSchema.parse(grammar)).toEqual(grammar)
  })

  it('rejects a frame word without its admitting lesson', () => {
    const frameWords = [{ word: 'the' }]

    expect(GrammarContentSchema.safeParse({ frameWords }).success).toBe(false)
  })

  it('rejects an inventory of no frame word', () => {
    expect(GrammarContentSchema.safeParse({ frameWords: [] }).success).toBe(false)
  })
})
