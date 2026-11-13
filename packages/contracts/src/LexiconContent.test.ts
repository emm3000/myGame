import { describe, expect, it } from 'vitest'
import { LexiconContentSchema } from './index'

const anchor = { frame: 'We are at school.', gappedFrame: 'We are at ____.' }

const laterFrameFor = (fromLessonId: string) => ({
  frame: 'My school is new.',
  gappedFrame: 'My ____ is new.',
  fromLessonId,
})

const school = {
  id: 'lesson-1-2',
  lemma: 'school',
  partOfSpeech: 'noun',
  frames: [anchor],
  gloss: { es: 'escuela' },
  definition: 'a place where children go to learn',
}

describe('LexiconContentSchema', () => {
  it('parses a card word with its anchor frame, gloss and definition', () => {
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

  it('parses a multi-word unit with the list that names it', () => {
    const giveUp = { ...school, id: 'word-1', lemma: 'give up', source: 'phave' }

    expect(LexiconContentSchema.parse([giveUp])).toEqual([giveUp])
  })

  it('rejects a source no unit list names', () => {
    expect(LexiconContentSchema.safeParse([{ ...school, source: 'ngsl' }]).success).toBe(false)
  })

  it('parses a word not yet glossed in any scaffold', () => {
    const unglossed = { ...school, gloss: {}, definition: undefined }

    expect(LexiconContentSchema.safeParse([unglossed]).success).toBe(true)
  })

  it('parses a card word with its anchor frame and two later frames', () => {
    const varied = {
      ...school,
      frames: [anchor, laterFrameFor('lesson-2'), laterFrameFor('lesson-3')],
    }

    expect(LexiconContentSchema.parse([varied])).toEqual([varied])
  })

  it('parses a frame with the token forms it uses in no card sense', () => {
    const likeThis = {
      ...school,
      frames: [
        { ...anchor, noCardSense: ['like'] },
        { ...laterFrameFor('lesson-2'), noCardSense: ['right'] },
      ],
    }

    expect(LexiconContentSchema.parse([likeThis])).toEqual([likeThis])
  })

  it('rejects an empty list of forms in no card sense', () => {
    const frames = [{ ...anchor, noCardSense: [] }]

    expect(LexiconContentSchema.safeParse([{ ...school, frames }]).success).toBe(false)
  })

  it('rejects a form in no card sense that is not one lowercase token', () => {
    const frames = [{ ...anchor, noCardSense: ['Right now'] }]

    expect(LexiconContentSchema.safeParse([{ ...school, frames }]).success).toBe(false)
  })

  it('rejects a word with no frame', () => {
    expect(LexiconContentSchema.safeParse([{ ...school, frames: [] }]).success).toBe(false)
  })

  it('rejects a word with a fourth frame', () => {
    const frames = [
      anchor,
      laterFrameFor('lesson-2'),
      laterFrameFor('lesson-3'),
      laterFrameFor('lesson-4'),
    ]

    expect(LexiconContentSchema.safeParse([{ ...school, frames }]).success).toBe(false)
  })

  it('rejects an anchor frame written for a later lesson', () => {
    const frames = [laterFrameFor('lesson-2')]

    expect(LexiconContentSchema.safeParse([{ ...school, frames }]).success).toBe(false)
  })

  it('rejects a later frame that names no lesson', () => {
    expect(LexiconContentSchema.safeParse([{ ...school, frames: [anchor, anchor] }]).success).toBe(
      false,
    )
  })

  it('rejects a frame without its gapped frame', () => {
    const frames = [{ frame: anchor.frame }]

    expect(LexiconContentSchema.safeParse([{ ...school, frames }]).success).toBe(false)
  })

  it('rejects a frame left at the top of an entry', () => {
    expect(LexiconContentSchema.safeParse([{ ...school, ...anchor }]).success).toBe(false)
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
