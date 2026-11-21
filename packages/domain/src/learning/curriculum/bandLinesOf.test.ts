import { describe, expect, it } from 'vitest'
import { MemoryCard } from '../../memory/MemoryCard'
import { Instant } from '../../time/Instant'
import type { HeldCard } from '../HeldCard'
import type { Lesson, LessonWord } from '../Lesson'
import type { BandStart } from './BandStart'
import { bandLinesOf } from './bandLinesOf'
import { inMemoryBands } from './testing/inMemoryBands'
import { inMemoryLessons } from './testing/inMemoryLessons'
import { lessonOne } from './testing/lessonOne'

const startedAt = Instant.fromEpochMilliseconds(Date.parse('2026-11-12T09:00:00Z'))

const wordOf = (headword: string): LessonWord => ({
  id: `word-${headword}`,
  acceptedForms: [headword],
  gloss: headword,
  definition: `definition of ${headword}`,
  frames: [{ frame: `The ${headword} is new.`, gappedFrame: 'The ____ is new.' }],
})

const chromeLesson: Lesson = { ...lessonOne, id: 'lesson-1', words: [wordOf('home')] }

const bandLesson: Lesson = {
  ...lessonOne,
  id: 'lesson-17',
  words: [wordOf('say'), wordOf('make'), wordOf('difficulty')],
}

const content = {
  lessons: inMemoryLessons([chromeLesson, bandLesson], []),
  bands: inMemoryBands([
    {
      band: 1,
      lessonIds: [bandLesson.id],
      words: [
        { headword: 'home', isChrome: true },
        { headword: 'say', isChrome: false },
        { headword: 'make', isChrome: false },
        { headword: 'take', isChrome: false },
      ],
    },
    {
      band: 2,
      lessonIds: [],
      words: [{ headword: 'difficulty', isChrome: false }],
    },
  ]),
}

const startOf = (band: number): BandStart => ({ band, startedAt, heldOutWords: [], checks: [] })

const heldOf = (...headwords: ReadonlyArray<string>): ReadonlyArray<HeldCard> =>
  headwords.map((headword) => ({ wordId: `word-${headword}`, card: MemoryCard.entered(startedAt) }))

describe('bandLinesOf', () => {
  it("counts the cards held of a band's card words outside the chrome lessons", () => {
    expect(bandLinesOf([startOf(1)], heldOf('say', 'make'), content)).toEqual([
      { band: 1, count: 2, total: 3 },
    ])
  })

  it("skips a chrome lesson's word of that band", () => {
    expect(bandLinesOf([startOf(1)], heldOf('home', 'say'), content)).toEqual([
      { band: 1, count: 1, total: 3 },
    ])
  })

  it('answers no line for a band not started', () => {
    expect(bandLinesOf([startOf(1)], heldOf('difficulty'), content)).toEqual([
      { band: 1, count: 0, total: 3 },
    ])
  })
})
