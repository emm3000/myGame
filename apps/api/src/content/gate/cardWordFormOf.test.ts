import { describe, expect, it } from 'vitest'
import type { CardWordFormContext } from './CardWordFormContext'
import { cardWordFormOf } from './cardWordFormOf'
import { entryOf } from './contentGate.testSupport'

const context: CardWordFormContext = { irregularVerbs: new Map(), haveBefore: 'none' }

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

  it('reads no ending on a verb lemma that ends in -ing', () => {
    const bring = entryOf('word-1', 'bring', 'We bring food.', { partOfSpeech: 'verb' })

    expect(cardWordFormOf('bring', bring, context)).toEqual({ kind: 'ungated' })
  })
})
