import { describe, expect, it } from 'vitest'
import { lessonOne } from '../testing/lessonOne'
import { unitLessonOne } from '../testing/unitLessonOne'
import type { Lesson } from './Lesson'
import { wordsEnteringOf } from './wordsEnteringOf'

const lessonTeachingTrue: Lesson = {
  ...lessonOne,
  words: [
    {
      id: 'word-true',
      acceptedForms: ['TRUE', 'true'],
      gloss: 'verdadero',
      definition: 'definition of verdadero',
      frames: [{ frame: 'That is true.', gappedFrame: 'That is ____.' }],
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

  it('enters no card for a unit with a held-out word', () => {
    const entering = wordsEnteringOf(unitLessonOne, ['give'])

    expect(entering.map(({ id }) => id)).toEqual(['find-out', 'go-on', 'come-back', 'of-course'])
  })

  it('holds a unit back by a held-out word that is not its first', () => {
    const entering = wordsEnteringOf(unitLessonOne, ['course'])

    expect(entering.map(({ id }) => id)).toEqual(['give-up', 'find-out', 'go-on', 'come-back'])
  })
})
