import { describe, expect, it } from 'vitest'
import {
  afterLessonOne,
  entryOf,
  lessonOneStructures,
  structureOf,
  textOf,
} from '../contentGate.testSupport'
import { checkGrammar } from './checkGrammar'

const structures = [
  ...lessonOneStructures,
  structureOf('lesson-1', ['can', 'will'], ['was', 'has', 'cannot']),
]

const newHolding = (frame: string, definition?: string) =>
  entryOf('word-1', 'new', frame, {
    partOfSpeech: 'adjective',
    ...(definition === undefined ? {} : { definition }),
  })

describe('content gate check 6, grammar: negatives speech contracts', () => {
  it.each([
    ['do not', "don't", 'We do not work at home.'],
    ['does not', "doesn't", 'She does not work at home.'],
    ['did not', "didn't", 'We did not work at home.'],
    ['is not', "isn't", 'My home is not new.'],
    ['are not', "aren't", 'We are not at home.'],
    ['was not', "wasn't", 'My home was not new.'],
    ['were not', "weren't", 'We were not at home.'],
    ['have not', "haven't", 'We have not been home.'],
    ['has not', "hasn't", 'She has not been home.'],
    ['had not', "hadn't", 'We had not been home.'],
    ['will not', "won't", 'We will not work at home.'],
    ['would not', "wouldn't", 'We would not work at home.'],
    ['could not', "couldn't", 'We could not work at home.'],
    ['should not', "shouldn't", 'We should not work at home.'],
    ['cannot', "can't", 'We cannot work at home.'],
  ])(
    'fails a frame holding %s, a negative speech contracts to %s',
    (negative, contracted, frame) => {
      expect(checkGrammar(afterLessonOne(structures, newHolding(frame)))).toEqual([
        `word-1: frame holds ${negative}, a negative speech contracts to ${contracted}`,
      ])
    },
  )

  it('fails a text sentence holding a negative speech contracts', () => {
    const content = {
      ...afterLessonOne(structures, newHolding('My home is new.')),
      texts: [textOf('lesson-2', ['We do not have food.'])],
    }

    expect(checkGrammar(content)).toEqual([
      "text-1: text holds do not, a negative speech contracts to don't",
    ])
  })

  it('passes a definition holding a negative speech contracts, since a definition is no frame', () => {
    const defined = newHolding('My home is new.', 'you do not have this')

    expect(checkGrammar(afterLessonOne(structures, defined))).toEqual([])
  })

  it('passes am not, which speech contracts to no negative of its own', () => {
    expect(checkGrammar(afterLessonOne(structures, newHolding('I am not at home.')))).toEqual([])
  })
})
