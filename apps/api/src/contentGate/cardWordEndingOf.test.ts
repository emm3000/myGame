import { describe, expect, it } from 'vitest'
import { cardWordEndingOf } from './cardWordEndingOf'
import { entryOf } from './contentGate.testSupport'

describe('cardWordEndingOf', () => {
  it('reads no ending on a form of a phrase, whatever it ends in', () => {
    const aLittle = entryOf('word-1', 'a little', 'I have a little food.', {
      partOfSpeech: 'phrase',
      source: 'phrase',
    })

    expect(['a littler', 'a littlest'].map((form) => cardWordEndingOf(form, aLittle))).toEqual([
      undefined,
      undefined,
    ])
  })
})
