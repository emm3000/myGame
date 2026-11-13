import { assert, describe, expect, it } from 'vitest'
import { inMemoryBands } from '../testing/inMemoryBands'
import { inMemoryFrames } from '../testing/inMemoryFrames'
import { inMemoryLessons } from '../testing/inMemoryLessons'
import { lessonOne } from '../testing/lessonOne'
import { townLessonTwo } from '../testing/townLessonTwo'
import type { FrameReader } from './FrameReader'
import { readingFrameOf } from './readingFrameOf'

const readerOf = (frames: FrameReader['lessons']['frameTokensOf']): FrameReader => ({
  cards: [],
  placedOutBands: [],
  scaffold: 'es',
  lessons: {
    ...inMemoryLessons([lessonOne, townLessonTwo], []),
    ...inMemoryBands([]),
    ...inMemoryFrames([], new Map()),
    frameTokensOf: frames,
  },
})

describe('readingFrameOf', () => {
  it("reads a word's anchor frame with its card words supported", () => {
    const home = lessonOne.words[0]
    assert(home !== undefined)
    const reader = readerOf((wordId, frame) =>
      wordId === 'home' && frame === 'We have a new home in this town.'
        ? [
            { text: 'We have a new home in this ', wordId: null },
            { text: 'town', wordId: 'town' },
            { text: '.', wordId: null },
          ]
        : undefined,
    )

    expect(readingFrameOf(home, reader)).toEqual([
      { text: 'We have a new home in this ', support: null },
      { text: 'town', support: { shown: 'beside', text: 'pueblo', language: 'es' } },
      { text: '.', support: null },
    ])
  })
})
