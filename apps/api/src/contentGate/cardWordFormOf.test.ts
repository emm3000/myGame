import { describe, expect, it } from 'vitest'
import { cardWordFormOf } from './cardWordFormOf'
import { entryOf } from './contentGate.testSupport'

const context = { irregularVerbs: new Map(), isAfterHave: false }

describe('cardWordFormOf', () => {
  it('reads no ending on a form of a phrase, whatever it ends in', () => {
    const aLittle = entryOf('word-1', 'a little', 'I have a little food.', {
      partOfSpeech: 'phrase',
      source: 'phrase',
    })

    expect(
      ['a littler', 'a littlest'].map((form) => cardWordFormOf(form, aLittle, context)),
    ).toEqual([{ kind: 'ungated' }, { kind: 'ungated' }])
  })
})
