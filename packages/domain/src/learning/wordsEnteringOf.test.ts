import { describe, expect, it } from 'vitest'
import { lessonOne } from '../testing/lessonOne'
import type { Lesson } from './Lesson'
import { wordsEnteringOf } from './wordsEnteringOf'

const lessonTeachingTrue: Lesson = {
  ...lessonOne,
  words: [
    {
      id: 'word-true',
      acceptedForms: ['TRUE', 'true'],
      gloss: 'verdadero',
      frame: 'That is true.',
      gappedFrame: 'That is ____.',
    },
  ],
}

describe('wordsEnteringOf', () => {
  it('holds out a capitalized lemma by its lowercase headword', () => {
    expect(wordsEnteringOf(lessonTeachingTrue, ['true'])).toEqual([])
  })

  it('enters every word when none is held out', () => {
    expect(wordsEnteringOf(lessonTeachingTrue, ['false'])).toEqual(lessonTeachingTrue.words)
  })
})
