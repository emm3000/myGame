import { describe, expect, it } from 'vitest'
import { apiPackagePath } from '../../../apiPackagePath.testSupport'
import {
  contentOf,
  entryOf,
  lessonOneFrameWords,
  lessonOneInflections,
  lessonOneLexicon,
  structureOf,
  textOf,
} from '../contentGate.testSupport'
import { gateContentOf } from '../readGateContent'
import { checkTexts } from './checkTexts'

const shippedContent = apiPackagePath('content/')

const lessonOneIds = lessonOneLexicon.map(({ id }) => id)

const leave = entryOf('word-1', 'leave', 'We leave home.', { partOfSpeech: 'verb' })

const newAtHome = entryOf('word-2', 'new', 'My home is new.', { partOfSpeech: 'adjective' })

const workOut = entryOf('unit-1', 'work out', 'We work out the money.', {
  partOfSpeech: 'verb',
  source: 'phave',
  gappedFrame: 'We ____ ____ the money.',
})

const withTexts = (...texts: ReadonlyArray<ReturnType<typeof textOf>>) =>
  contentOf({
    lexicon: [...lessonOneLexicon, leave, newAtHome],
    lessons: [
      ['lesson-1', lessonOneIds],
      ['lesson-2', [leave.id]],
      ['lesson-3', [newAtHome.id]],
    ],
    texts,
  })

const withUnitLesson = (...texts: ReadonlyArray<ReturnType<typeof textOf>>) => {
  const forms = new Map(contentOf().forms)
  forms.set('it', new Set(['it']))
  forms.set('out', new Set(['out']))
  return contentOf({
    lexicon: [...lessonOneLexicon, workOut, leave],
    lessons: [
      ['lesson-1', lessonOneIds],
      ['lesson-2', [workOut.id]],
      ['lesson-3', [leave.id]],
    ],
    structures: [
      structureOf('lesson-1', [...lessonOneFrameWords, 'it', 'out'], [...lessonOneInflections]),
    ],
    forms,
    texts,
  })
}

describe('content gate check 4, coverage of a running text', () => {
  it('passes the shipped texts', () => {
    expect(checkTexts(gateContentOf(shippedContent))).toEqual([])
  })

  it('passes a text whose every token is a frame word, an admitted inflection or a card word taught at or before its lesson', () => {
    const text = textOf('lesson-2', ['We leave home.', 'They work at my school for money.'])

    expect(checkTexts(withTexts(text))).toEqual([])
  })

  it('fails a text holding a token unknown at its lesson', () => {
    const text = textOf('lesson-2', ['We leave my new home.'])

    expect(checkTexts(withTexts(text))).toEqual([
      'text-1: text holds new, a word no lesson teaches at or before lesson-2',
    ])
  })

  it('fails a text whose title holds a token unknown at its lesson', () => {
    const text = textOf('lesson-2', ['We leave home.'], { title: 'My new home' })

    expect(checkTexts(withTexts(text))).toEqual([
      'text-1: text holds new, a word no lesson teaches at or before lesson-2',
    ])
  })

  it('fails a text holding a frame word admitted after its lesson', () => {
    const structures = [
      structureOf(
        'lesson-1',
        lessonOneFrameWords.filter((word) => word !== 'much'),
        lessonOneInflections,
      ),
      structureOf('lesson-3', ['much']),
    ]
    const content = withTexts(textOf('lesson-2', ['We do not have much money.']))

    expect(checkTexts({ ...content, grammar: contentOf({ structures }).grammar })).toEqual([
      'text-1: text holds much, a frame word admitted after lesson-2',
    ])
  })

  it('fails a text holding a frame word whose structure names a lesson the curriculum does not list', () => {
    const structures = [
      structureOf(
        'lesson-1',
        lessonOneFrameWords.filter((word) => word !== 'much'),
        lessonOneInflections,
      ),
      structureOf('lesson-9', ['much']),
    ]
    const content = withTexts(textOf('lesson-2', ['We do not have much money.']))

    expect(checkTexts({ ...content, grammar: contentOf({ structures }).grammar })).toEqual([
      'text-1: text holds much, a frame word admitted after lesson-2',
    ])
  })

  it('fails a text holding a form the NGSL teaching list does not know', () => {
    const text = textOf('lesson-2', ['We leave home, sir.'])

    expect(checkTexts(withTexts(text))).toEqual([
      'text-1: text holds sir, which no NGSL form or off-list word spells',
    ])
  })

  it('fails a homograph form the text names no word for', () => {
    const text = textOf('lesson-2', ['We left home.'])

    expect(checkTexts(withTexts(text))).toEqual([
      'text-1: text holds the homograph left and names no word for it',
    ])
  })

  it('passes a homograph form the text names the word it means for', () => {
    const text = textOf('lesson-2', ['We left home.'], { homographs: { left: 'leave' } })

    expect(checkTexts(withTexts(text))).toEqual([])
  })

  it('fails a form in no card sense that the text does not hold', () => {
    const text = textOf('lesson-2', ['We leave home.'], { noCardSense: ['school'] })

    expect(checkTexts(withTexts(text))).toEqual([
      'text-1: names school in no card sense, a token its text does not hold',
    ])
  })

  it('passes a card word a text holds inflected', () => {
    const text = textOf('lesson-3', ['We worked out the money.'])

    expect(checkTexts(withUnitLesson(text))).toEqual([])
  })

  it('passes a unit no lesson taught by its lesson, a gap the review of check 7 holds', () => {
    const text = textOf('lesson-1', ['We work it out.'])

    expect(checkTexts(withUnitLesson(text))).toEqual([])
  })

  it('fails a text written for a unit lesson', () => {
    const text = textOf('lesson-2', ['We work it out.'])

    expect(checkTexts(withUnitLesson(text))).toEqual(['text-1: text names lesson-2, a unit lesson'])
  })

  it('fails a text written for a lesson the curriculum does not list', () => {
    const text = textOf('lesson-9', ['We leave home.'])

    expect(checkTexts(withTexts(text))).toEqual([
      'text-1: text names lesson-9, a lesson the curriculum does not list',
    ])
  })
})
