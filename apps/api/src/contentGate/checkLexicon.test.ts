import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { checkLexicon } from './checkLexicon'
import {
  contentOf,
  entryOf,
  lessonOneFrameWords,
  lessonOneLexicon,
  structureOf,
} from './contentGate.testSupport'
import { gateContentOf } from './gateContentOf'

const shippedContent = fileURLToPath(new URL('../../content/', import.meta.url))

const lessonOneIds = lessonOneLexicon.map(({ id }) => id)

const lessonOneStructure = structureOf('lesson-1', lessonOneFrameWords)

describe('content gate check 1, the lexicon holds', () => {
  it('passes the shipped content', () => {
    expect(checkLexicon(gateContentOf(shippedContent))).toEqual([])
  })

  it('fails a word id used twice', () => {
    const secondHome = entryOf('lesson-1-1', 'new', 'This is new.')

    expect(checkLexicon(contentOf({ lexicon: [...lessonOneLexicon, secondHome] }))).toEqual([
      'word id lesson-1-1 is used more than once',
    ])
  })

  it('fails a lemma that is neither an NGSL headword nor marked off-list', () => {
    const password = entryOf('word-1', 'password', 'This is my password.')

    expect(checkLexicon(contentOf({ lexicon: [...lessonOneLexicon, password] }))).toEqual([
      'word-1: password is neither an NGSL headword nor marked off-list',
    ])
  })

  it('passes a lemma outside the NGSL marked off-list', () => {
    const password = entryOf('word-1', 'password', 'This is my password.', { isOffList: true })

    expect(checkLexicon(contentOf({ lexicon: [...lessonOneLexicon, password] }))).toEqual([])
  })

  it('fails an NGSL headword marked off-list', () => {
    const offListNew = entryOf('word-1', 'new', 'This is new.', { isOffList: true })

    expect(checkLexicon(contentOf({ lexicon: [...lessonOneLexicon, offListNew] }))).toEqual([
      'word-1: new is an NGSL headword marked off-list',
    ])
  })

  it('fails a card word taught by two lessons', () => {
    const lessons = [
      ['lesson-1', lessonOneIds],
      ['lesson-2', ['lesson-1-5']],
    ] as const

    expect(checkLexicon(contentOf({ lessons }))).toEqual([
      'lesson-1-5: food is taught by lesson-1 and lesson-2',
    ])
  })

  it('fails a lexicon entry that is a frame word', () => {
    const have = entryOf('word-1', 'have', 'We have it.', { partOfSpeech: 'verb' })

    expect(checkLexicon(contentOf({ lexicon: [...lessonOneLexicon, have] }))).toEqual([
      'word-1: have is a frame word, which never has a lexicon entry',
    ])
  })

  it('fails a frame word listed twice in the grammar', () => {
    const structures = [lessonOneStructure, structureOf('lesson-1', ['for'])]

    expect(checkLexicon(contentOf({ structures }))).toEqual([
      'frame word for is listed more than once',
    ])
  })

  it('fails a frame word outside the first 100 NGSL ranks', () => {
    const structures = [lessonOneStructure, structureOf('lesson-1', ['money'])]
    const lexicon = lessonOneLexicon.filter(({ lemma }) => lemma !== 'money')
    const lessons = [['lesson-1', lexicon.map(({ id }) => id)]] as const

    expect(checkLexicon(contentOf({ structures, lexicon, lessons }))).toEqual([
      'frame word money is not among the first 100 NGSL ranks',
    ])
  })
})
