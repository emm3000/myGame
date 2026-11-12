import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import type { LexiconEntry } from '../adapters/json/lessonContentFilesOf'
import { checkOrder } from './checkOrder'
import {
  contentOf,
  entryOf,
  lessonOneFrameWords,
  lessonOneLexicon,
  structureOf,
} from './contentGate.testSupport'
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
  extraEntries: ReadonlyArray<LexiconEntry> = [],
) => {
  const words = [...bandWords('b', 501, bandOne), ...bandWords('d', 1001, bandTwo)]
  return contentOf({
    ranks: new Map([...frameWordRanks, ...chromeRanks, ...words]),
    lexicon: [...lessonOneLexicon, ...words.map(([lemma]) => cardOf(lemma)), ...extraEntries],
    lessons: [
      ['lesson-1', lessonOneLexicon.map(({ id }) => id)],
      ...lessons.map(
        (lemmas, index) => [`lesson-${index + 2}`, lemmas.map((lemma) => `id-${lemma}`)] as const,
      ),
    ],
  })
}

const unitOf = (lemma: string, source: 'phave' | 'phrase' = 'phrase'): LexiconEntry =>
  entryOf(`id-${lemma}`, lemma, `${lemma}.`, { source })

const readyLemmas = [
  'work on',
  'home at',
  'food for',
  'money on',
  'school at',
  'work at',
  'home for',
  'food on',
  'money at',
  'school for',
]

const readyUnits = readyLemmas.map((lemma) => unitOf(lemma))

const bandLessonRun = (first: number, count: number): ReadonlyArray<ReadonlyArray<string>> =>
  Array.from({ length: count }, (_, lesson) =>
    Array.from({ length: 5 }, (_, word) => `b${first + lesson * 5 + word}`),
  )

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
  it('passes a unit lesson of five ready units', () => {
    expect(checkOrder(bandLessons(40, 0, [readyLemmas.slice(0, 5)], readyUnits))).toEqual([])
  })

  it('passes a unit lesson of nine ready units', () => {
    expect(checkOrder(bandLessons(40, 0, [readyLemmas.slice(0, 9)], readyUnits))).toEqual([])
  })

  it('fails a unit lesson of fewer than five units', () => {
    expect(checkOrder(bandLessons(40, 0, [readyLemmas.slice(0, 4)], readyUnits))).toEqual([
      'lesson-2: teaches 4 units, not 5 to 9',
    ])
  })

  it('fails a unit lesson of more than nine units', () => {
    expect(checkOrder(bandLessons(40, 0, [readyLemmas], readyUnits))).toEqual([
      'lesson-2: teaches 10 units, not 5 to 9',
    ])
  })

  it('fails a unit taught by a chrome lesson', () => {
    const content = contentOf({
      lexicon: [...lessonOneLexicon, ...readyUnits],
      lessons: [['lesson-1', [...lessonOneLexicon.map(({ id }) => id), 'id-work on']]],
    })

    expect(checkOrder(content)).toEqual([
      'lesson-1: teaches the multi-word unit work on, which no chrome lesson teaches',
    ])
  })

  it('fails a lesson that mixes a unit and a single word', () => {
    expect(
      checkOrder(bandLessons(40, 0, [['b1', 'b2', 'b3', 'b4', 'work on']], readyUnits)),
    ).toEqual(['lesson-2: mixes multi-word units with single words'])
  })

  it('fails a unit no earlier lesson makes ready', () => {
    const unready = unitOf('b1 on')
    const lessons = [
      ['b1 on', ...readyLemmas.slice(0, 4)],
      ['b1', 'b2', 'b3', 'b4', 'b5'],
    ]

    expect(checkOrder(bandLessons(40, 0, lessons, [...readyUnits, unready]))).toEqual([
      'lesson-2: b1 on holds b1, a word no earlier lesson teaches',
    ])
  })

  it('passes a unit whose card word an earlier band lesson teaches', () => {
    const ready = unitOf('b1 on')
    const lessons = [
      ['b1', 'b2', 'b3', 'b4', 'b5'],
      ['b1 on', ...readyLemmas.slice(0, 4)],
    ]

    expect(checkOrder(bandLessons(40, 0, lessons, [...readyUnits, ready]))).toEqual([])
  })

  it('fails a unit holding a frame word admitted after its lesson', () => {
    const workUp = unitOf('work up')
    const lessons = [
      ['work up', ...readyLemmas.slice(1, 5)],
      ['b1', 'b2', 'b3', 'b4', 'b5'],
    ]
    const content = bandLessons(40, 0, lessons, [...readyUnits, workUp])
    const structures = [
      structureOf('lesson-1', lessonOneFrameWords),
      structureOf('lesson-3', ['up']),
    ]

    expect(checkOrder({ ...content, grammar: { structures } })).toEqual([
      'lesson-2: work up holds up, a frame word admitted after lesson-2',
    ])
  })

  it('fails two phrasal verbs of one lesson that share their verb', () => {
    const units = [
      unitOf('work on', 'phave'),
      unitOf('work at', 'phave'),
      ...readyUnits.slice(1, 5),
    ]
    const lessons = [['work on', 'work at', ...readyLemmas.slice(1, 4)]]

    expect(checkOrder(bandLessons(40, 0, lessons, units))).toEqual([
      'lesson-2: the phrasal verbs work on and work at share their verb work',
    ])
  })

  it('passes a phrasal verb and a phrase that share their first word', () => {
    const units = [unitOf('work on', 'phave'), unitOf('work at'), ...readyUnits.slice(1, 5)]
    const lessons = [['work on', 'work at', ...readyLemmas.slice(1, 4)]]

    expect(checkOrder(bandLessons(40, 0, lessons, units))).toEqual([])
  })

  it('fails two unit lessons fewer than 4 band lessons apart', () => {
    const lessons = [readyLemmas.slice(0, 5), ...bandLessonRun(1, 3), readyLemmas.slice(5)]

    expect(checkOrder(bandLessons(40, 0, lessons, readyUnits))).toEqual([
      'lesson-6: comes 3 band lessons after the unit lesson lesson-2, not at least 4',
    ])
  })

  it('passes two unit lessons 4 band lessons apart', () => {
    const lessons = [readyLemmas.slice(0, 5), ...bandLessonRun(1, 4), readyLemmas.slice(5)]

    expect(checkOrder(bandLessons(40, 0, lessons, readyUnits))).toEqual([])
  })
})
