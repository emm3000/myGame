import { describe, expect, it } from 'vitest'
import { LexiconContentSchema } from './index'

const school = {
  id: 'lesson-1-2',
  lemma: 'school',
  partOfSpeech: 'noun',
  frame: 'We are at school.',
  gappedFrame: 'We are at ____.',
  gloss: { es: 'escuela' },
  definition: 'a place where children go to learn',
}

describe('LexiconContentSchema', () => {
  it('parses a card word with its frame, gloss and definition', () => {
    expect(LexiconContentSchema.parse([school])).toEqual([school])
  })

  it('parses a card word with its accepted forms, homographs and off-list mark', () => {
    const password = {
      ...school,
      id: 'word-1',
      lemma: 'password',
      acceptedForms: ['pass word'],
      homographs: { left: 'leave' },
      isOffList: true,
    }

    expect(LexiconContentSchema.parse([password])).toEqual([password])
  })

  it('parses a word not yet glossed in any scaffold', () => {
    const unglossed = { ...school, gloss: {}, definition: undefined }

    expect(LexiconContentSchema.safeParse([unglossed]).success).toBe(true)
  })

  it('rejects a word without its gapped frame', () => {
    const { gappedFrame: _, ...ungapped } = school

    expect(LexiconContentSchema.safeParse([ungapped]).success).toBe(false)
  })

  it('rejects a part of speech the lexicon does not know', () => {
    expect(LexiconContentSchema.safeParse([{ ...school, partOfSpeech: 'article' }]).success).toBe(
      false,
    )
  })

  it('rejects a rank copied into an entry', () => {
    expect(LexiconContentSchema.safeParse([{ ...school, rank: 146 }]).success).toBe(false)
  })

  it('rejects a gloss in a language no scaffold ships', () => {
    expect(LexiconContentSchema.safeParse([{ ...school, gloss: { fr: 'école' } }]).success).toBe(
      false,
    )
  })
})
