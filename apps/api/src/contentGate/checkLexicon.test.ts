import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { checkLexicon } from './checkLexicon'
import { contentOf, entryOf, lessonOneLexicon } from './contentGate.testSupport'
import { gateContentOf } from './gateContentOf'

const shippedContent = fileURLToPath(new URL('../../content/', import.meta.url))

const lessonOneIds = lessonOneLexicon.map(({ id }) => id)

const lessonOneFrameWords = contentOf().grammar.frameWords.map(
  ({ word, admittingLessonId }) => [word, admittingLessonId] as const,
)

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
    const frameWords = [...lessonOneFrameWords, ['for', 'lesson-1'] as const]

    expect(checkLexicon(contentOf({ frameWords }))).toEqual([
      'frame word for is listed more than once',
    ])
  })

  it('fails a frame word outside the first 100 NGSL ranks', () => {
    const frameWords = [...lessonOneFrameWords, ['money', 'lesson-1'] as const]
    const lexicon = lessonOneLexicon.filter(({ lemma }) => lemma !== 'money')
    const lessons = [['lesson-1', lexicon.map(({ id }) => id)]] as const

    expect(checkLexicon(contentOf({ frameWords, lexicon, lessons }))).toEqual([
      'frame word money is not among the first 100 NGSL ranks',
    ])
  })

  it('fails a frame word admitted by a lesson the curriculum does not list', () => {
    const frameWords = [...lessonOneFrameWords, ['new', 'lesson-9'] as const]

    expect(checkLexicon(contentOf({ frameWords }))).toEqual([
      'frame word new is admitted by lesson-9, which the curriculum does not list',
    ])
  })
})
