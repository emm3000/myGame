import { describe, expect, it } from 'vitest'
import type { LexiconEntry } from '../../infrastructure/json/readLessonContentFiles'
import { afterLessonOne, entryOf, lessonOneStructures, textOf } from '../contentGate.testSupport'
import { checkGrammar } from './checkGrammar'

const newHolding = (frame: string, extra: Partial<LexiconEntry> = {}): LexiconEntry =>
  entryOf('word-1', 'new', frame, { partOfSpeech: 'adjective', ...extra })

const withNew = (entry: LexiconEntry) => afterLessonOne(lessonOneStructures, entry)

const unadmitted = (held: string, structure: string): string =>
  `word-1: frame holds ${held}, ${structure}, a structure grammar.json does not admit`

describe('content gate check 6, grammar: structures grammar.json does not admit', () => {
  it.each([
    ['used to with a verb', 'We used to work at home.', 'used to work'],
    ['used to with a verb', 'There used to be food at home.', 'used to be'],
    ['so with an adjective', 'Why is my home so new?', 'so new'],
    ['more with an adjective', 'This home is more new than my school.', 'more new'],
  ])('fails a frame holding %s: %s', (structure, frame, held) => {
    expect(checkGrammar(withNew(newHolding(frame)))).toEqual([unadmitted(held, structure)])
  })

  it('fails a structure a no card sense entry names', () => {
    const named = newHolding('Why is my home so new?', {
      frames: [
        {
          frame: 'Why is my home so new?',
          gappedFrame: 'Why is my home so ____?',
          noCardSense: ['so'],
        },
      ],
    })

    expect(checkGrammar(withNew(named))).toEqual([unadmitted('so new', 'so with an adjective')])
  })

  it('fails a text sentence holding a structure grammar.json does not admit', () => {
    const content = {
      ...withNew(newHolding('My home is new.')),
      texts: [textOf('lesson-2', ['We used to work at home.'])],
    }

    expect(checkGrammar(content)).toEqual([
      'text-1: text holds used to work, used to with a verb, a structure grammar.json does not admit',
    ])
  })

  it('passes so as a conjunction before a pronoun', () => {
    expect(checkGrammar(withNew(newHolding('We work, so we have new food.')))).toEqual([])
  })

  it('passes more as a quantifier before an adjective and its noun', () => {
    expect(checkGrammar(withNew(newHolding('We have more new food.')))).toEqual([])
  })

  it('passes a definition holding used to with a verb, which a passive also spells', () => {
    const defined = newHolding('My home is new.', { definition: 'often used to work at home' })

    expect(checkGrammar(withNew(defined))).toEqual([])
  })
})
