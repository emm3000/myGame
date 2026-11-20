import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { checkTextWords } from './checkTextWords'
import { contentOf, entryOf, lessonOneLexicon, textOf } from './contentGate.testSupport'
import { gateContentOf } from './gateContentOf'

const shippedContent = fileURLToPath(new URL('../../content/', import.meta.url))

const river = entryOf('word-2', 'river', 'We live by the river.')

const farm = entryOf('word-3', 'farm', 'We work on the farm.')

const workOut = entryOf('unit-1', 'work out', 'We work out the money.', {
  partOfSpeech: 'verb',
  source: 'phave',
  gappedFrame: 'We ____ ____ the money.',
})

const field = entryOf('word-5', 'field', 'We work in the field.')

const map = entryOf('word-6', 'map', 'This is the map.')

const start = entryOf('word-7', 'start', 'We start at home.', { partOfSpeech: 'verb' })

const bandForms: ReadonlyArray<readonly [string, string]> = [
  ['river', 'river'],
  ['farm', 'farm'],
  ['field', 'field'],
  ['map', 'map'],
  ['start', 'start'],
  ['started', 'start'],
]

const withTexts = (...texts: ReadonlyArray<ReturnType<typeof textOf>>) => {
  const forms = new Map(contentOf().forms)
  for (const [form, word] of bandForms) {
    forms.set(form, new Set([word]))
  }
  return contentOf({
    lexicon: [...lessonOneLexicon, river, farm, workOut, field, map, start],
    lessons: [
      ['lesson-1', lessonOneLexicon.map(({ id }) => id)],
      ['lesson-2', [river.id]],
      ['lesson-3', [farm.id]],
      ['lesson-4', [workOut.id]],
      ['lesson-5', [field.id]],
      ['lesson-6', [map.id]],
      ['lesson-7', [start.id]],
    ],
    forms,
    texts,
  })
}

describe('content gate, the card words of a running text', () => {
  it('passes the shipped texts', () => {
    expect(checkTextWords(gateContentOf(shippedContent))).toEqual([])
  })

  it('fails a text missing a card word of its four band lessons', () => {
    const text = textOf('lesson-7', ['We start the farm on the map.'])

    expect(checkTextWords(withTexts(text))).toEqual([
      'text-1: text holds no form of field, a card word of lesson-5',
    ])
  })

  it('counts an inflected form as the word', () => {
    const text = textOf('lesson-7', ['We started the farm by the field on the map.'])

    expect(checkTextWords(withTexts(text))).toEqual([])
  })

  it('does not count a form the text names in no card sense', () => {
    const text = textOf('lesson-7', ['We start the farm by the field on the map.'], {
      noCardSense: ['map'],
    })

    expect(checkTextWords(withTexts(text))).toEqual([
      'text-1: text holds no form of map, a card word of lesson-6',
    ])
  })
})
