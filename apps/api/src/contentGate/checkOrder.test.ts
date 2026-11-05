import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import type { LexiconEntry } from '../adapters/json/lessonContentFilesOf'
import { checkOrder } from './checkOrder'
import { contentOf, entryOf, lessonOneLexicon } from './contentGate.testSupport'
import { gateContentOf } from './gateContentOf'

const shippedContent = fileURLToPath(new URL('../../content/', import.meta.url))

const frameWordRanks = [...contentOf().ranks].filter(([, rank]) => rank <= 23)

const chromeRanks = lessonOneLexicon.flatMap(({ lemma }) => {
  const rank = contentOf().ranks.get(lemma)
  return rank === undefined ? [] : [[lemma, rank] as const]
})

const bandWords = (prefix: string, firstRank: number, count: number) =>
  Array.from({ length: count }, (_, index) => [`${prefix}${index + 1}`, firstRank + index] as const)

const cardOf = (lemma: string): LexiconEntry => entryOf(`id-${lemma}`, lemma, `${lemma}.`)

const bandLessons = (
  bandOne: number,
  bandTwo: number,
  lessons: ReadonlyArray<ReadonlyArray<string>>,
  offList: ReadonlyArray<LexiconEntry> = [],
) => {
  const words = [...bandWords('b', 501, bandOne), ...bandWords('d', 1001, bandTwo)]
  return contentOf({
    ranks: new Map([...frameWordRanks, ...chromeRanks, ...words]),
    lexicon: [...lessonOneLexicon, ...words.map(([lemma]) => cardOf(lemma)), ...offList],
    lessons: [
      ['lesson-1', lessonOneLexicon.map(({ id }) => id)],
      ...lessons.map(
        (lemmas, index) => [`lesson-${index + 2}`, lemmas.map((lemma) => `id-${lemma}`)] as const,
      ),
    ],
  })
}

describe('content gate check 2, the order holds', () => {
  it('passes the shipped curriculum', () => {
    expect(checkOrder(gateContentOf(shippedContent))).toEqual([])
  })

  it('passes a band lesson holding the head word and four words of the window', () => {
    expect(checkOrder(bandLessons(40, 0, [['b1', 'b2', 'b3', 'b4', 'b30']]))).toEqual([])
  })

  it('fails a band lesson without the lowest-ranked untaught card word of its band', () => {
    expect(checkOrder(bandLessons(40, 0, [['b2', 'b3', 'b4', 'b5', 'b6']]))).toEqual([
      'lesson-2: does not hold b1, the lowest-ranked untaught card word of band 1',
    ])
  })

  it('fails a word outside the 30 lowest-ranked untaught card words of its band', () => {
    expect(checkOrder(bandLessons(40, 0, [['b1', 'b2', 'b3', 'b4', 'b31']]))).toEqual([
      'lesson-2: b31 is not among the 30 lowest-ranked untaught card words of band 1',
    ])
  })

  it('fails a band lesson of other than 5 card words', () => {
    expect(checkOrder(bandLessons(40, 0, [['b1', 'b2', 'b3', 'b4']]))).toEqual([
      'lesson-2: teaches 4 card words, not 5',
    ])
  })

  it('passes a band last lesson that takes every one of its fewer than 10 untaught words', () => {
    const lessons = [
      ['b1', 'b2', 'b3', 'b4', 'b5'],
      ['b6', 'b7', 'b8', 'b9', 'b10', 'b11', 'b12'],
    ]

    expect(checkOrder(bandLessons(12, 0, lessons))).toEqual([])
  })

  it('fails a band last lesson that leaves some of its fewer than 10 untaught words', () => {
    const lessons = [
      ['b1', 'b2', 'b3', 'b4', 'b5'],
      ['b6', 'b7', 'b8', 'b9', 'b10'],
    ]

    expect(checkOrder(bandLessons(12, 0, lessons))).toEqual([
      'lesson-3: teaches 5 card words, not 7',
    ])
  })

  it('passes band 2 once band 1 is taught', () => {
    const lessons = [
      ['b1', 'b2', 'b3', 'b4', 'b5'],
      ['d1', 'd2', 'd3', 'd4', 'd5'],
    ]

    expect(checkOrder(bandLessons(5, 10, lessons))).toEqual([])
  })

  it('fails a band 2 word taught before band 1 is', () => {
    expect(checkOrder(bandLessons(40, 10, [['b1', 'b2', 'b3', 'b4', 'd1']]))).toEqual([
      'lesson-2: d1 is not among the 30 lowest-ranked untaught card words of band 1',
    ])
  })

  it('fails an off-list word taught after the chrome lessons', () => {
    const password = entryOf('id-password', 'password', 'password.', { isOffList: true })

    expect(
      checkOrder(bandLessons(40, 0, [['b1', 'b2', 'b3', 'b4', 'password']], [password])),
    ).toEqual(['lesson-2: password is off-list, which only a chrome lesson teaches'])
  })

  it('fails a lesson after every band is taught', () => {
    const lessons = [['b1', 'b2', 'b3', 'b4', 'b5'], ['b1']]

    expect(checkOrder(bandLessons(5, 0, lessons))).toEqual([
      'lesson-3: comes after every band is taught',
    ])
  })

  it('fails a chrome count above the lessons the curriculum lists', () => {
    expect(checkOrder(contentOf({ chromeLessonCount: 2 }))).toEqual([
      'curriculum counts 2 chrome lessons but lists 1 lesson',
    ])
  })
})
