import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import type { LexiconEntry } from '../adapters/json/lessonContentFilesOf'
import { checkGrammar } from './checkGrammar'
import {
  contentOf,
  entryOf,
  laterFrameOf,
  lessonOneFrameWords,
  lessonOneInflections,
  lessonOneLexicon,
  structureOf,
} from './contentGate.testSupport'
import { gateContentOf } from './gateContentOf'

const shippedContent = fileURLToPath(new URL('../../content/', import.meta.url))

const lessonOneIds = lessonOneLexicon.map(({ id }) => id)

const afterLessonOne = (
  structures: ReturnType<typeof contentOf>['grammar']['structures'],
  ...laterLessons: ReadonlyArray<LexiconEntry>
) =>
  contentOf({
    structures,
    lexicon: [...lessonOneLexicon, ...laterLessons],
    lessons: [
      ['lesson-1', lessonOneIds],
      ...laterLessons.map(({ id }, index) => [`lesson-${index + 2}`, [id]] as const),
    ],
  })

const lessonOneStructures = [structureOf('lesson-1', lessonOneFrameWords, lessonOneInflections)]

const newHome = entryOf('word-1', 'new', 'This is my new home.', { partOfSpeech: 'adjective' })

const ourAdmittedAtLessonThree = [
  structureOf(
    'lesson-1',
    lessonOneFrameWords,
    lessonOneInflections.filter((inflection) => inflection !== 'our'),
  ),
  structureOf('lesson-3', [], ['our']),
]

const ourHomeFrom = (fromLessonId: string) => {
  const leave = entryOf('word-1', 'leave', 'We leave home.', { partOfSpeech: 'verb' })
  const newAtHome = entryOf('word-2', 'new', 'My home is new.', { partOfSpeech: 'adjective' })
  return contentOf({
    structures: ourAdmittedAtLessonThree,
    lexicon: [
      entryOf('lesson-1-1', 'home', 'This is my home.', {
        laterFrames: [laterFrameOf('home', 'This is our home.', fromLessonId)],
      }),
      ...lessonOneLexicon.slice(1),
      leave,
      newAtHome,
    ],
    lessons: [
      ['lesson-1', lessonOneIds],
      ['lesson-2', [leave.id]],
      ['lesson-3', [newAtHome.id]],
    ],
  })
}

describe('content gate check 6, grammar', () => {
  it('passes the shipped content, lesson 1 included', () => {
    expect(checkGrammar(gateContentOf(shippedContent))).toEqual([])
  })

  it('fails a frame word admitted after the lesson', () => {
    const structures = [
      structureOf(
        'lesson-1',
        lessonOneFrameWords.filter((word) => word !== 'much'),
        lessonOneInflections,
      ),
      structureOf('lesson-2', ['much']),
    ]

    expect(checkGrammar(afterLessonOne(structures, newHome))).toEqual([
      'lesson-1-4: frame holds much, a frame word admitted after lesson-1',
    ])
  })

  it('fails a frame using an inflection its lesson does not admit', () => {
    const structures = [
      structureOf(
        'lesson-1',
        lessonOneFrameWords,
        lessonOneInflections.filter((inflection) => inflection !== 'is'),
      ),
      structureOf('lesson-2', [], ['is']),
    ]

    expect(checkGrammar(afterLessonOne(structures, newHome))).toEqual([
      'lesson-1-1: frame holds is, an inflection admitted after lesson-1',
    ])
  })

  it('fails a frame using an inflection no structure admits', () => {
    const structures = [
      structureOf(
        'lesson-1',
        lessonOneFrameWords,
        lessonOneInflections.filter((inflection) => inflection !== 'my'),
      ),
    ]

    expect(checkGrammar(contentOf({ structures }))).toEqual([
      'lesson-1-1: frame holds my, an inflection no structure admits',
    ])
  })

  it('fails the past of a card verb before its lesson admits -ed', () => {
    const structures = [
      structureOf('lesson-1', lessonOneFrameWords, lessonOneInflections),
      structureOf('lesson-3', [], ['-ed']),
    ]
    const newHomeWorked = entryOf('word-1', 'new', 'They worked at my new home.', {
      partOfSpeech: 'adjective',
    })
    const later = entryOf('word-2', 'leave', 'We leave home.', { partOfSpeech: 'verb' })

    expect(checkGrammar(afterLessonOne(structures, newHomeWorked, later))).toEqual([
      'word-1: frame holds worked, an -ed inflection admitted after lesson-2',
    ])
  })

  it('fails the third person of a card verb no structure admits -s for', () => {
    const newHome = entryOf('word-1', 'new', 'This works for my new home.', {
      partOfSpeech: 'adjective',
    })

    expect(checkGrammar(afterLessonOne(lessonOneStructures, newHome))).toEqual([
      'word-1: frame holds works, an -s inflection no structure admits',
    ])
  })

  it('reads goes and tries as the -s of a card verb, never its -ed', () => {
    const structures = [...lessonOneStructures, structureOf('lesson-1', [], ['-s'])]
    const go = entryOf('word-1', 'go', 'We go home.', { partOfSpeech: 'verb' })
    const tryIt = entryOf('word-2', 'try', 'We try for you.', { partOfSpeech: 'verb' })
    const newHome = entryOf('word-3', 'new', 'This goes for my new home.', {
      partOfSpeech: 'adjective',
    })
    const leave = entryOf('word-4', 'leave', 'This tries us, we leave.', { partOfSpeech: 'verb' })

    expect(checkGrammar(afterLessonOne(structures, go, tryIt, newHome, leave))).toEqual([])
  })

  it('fails the -ing form of a card verb no structure admits -ing for', () => {
    const newHome = entryOf('word-1', 'new', 'We are working at my new home.', {
      partOfSpeech: 'adjective',
    })

    expect(checkGrammar(afterLessonOne(lessonOneStructures, newHome))).toEqual([
      'word-1: frame holds working, an -ing inflection no structure admits',
    ])
  })

  it('fails the comparative of a card adjective no structure admits -er for', () => {
    const leave = entryOf('word-2', 'leave', 'We leave my newer home.', { partOfSpeech: 'verb' })

    expect(checkGrammar(afterLessonOne(lessonOneStructures, newHome, leave))).toEqual([
      'word-2: frame holds newer, an -er inflection no structure admits',
    ])
  })

  it('fails the superlative of a card adjective no structure admits -est for', () => {
    const leave = entryOf('word-2', 'leave', 'We leave my newest home.', { partOfSpeech: 'verb' })

    expect(checkGrammar(afterLessonOne(lessonOneStructures, newHome, leave))).toEqual([
      'word-2: frame holds newest, an -est inflection no structure admits',
    ])
  })

  it('passes the plural of a card noun, which no structure gates', () => {
    const newHomes = entryOf('word-1', 'new', 'We have new homes.', { partOfSpeech: 'adjective' })

    expect(checkGrammar(afterLessonOne(lessonOneStructures, newHomes))).toEqual([])
  })

  it('reads a homograph form by the word its entry names', () => {
    const leave = entryOf('word-1', 'leave', 'We leave home.', { partOfSpeech: 'verb' })
    const newAfterLeaving = entryOf('word-2', 'new', 'We left my new home.', {
      partOfSpeech: 'adjective',
      homographs: { left: 'leave' },
    })

    expect(checkGrammar(afterLessonOne(lessonOneStructures, leave, newAfterLeaving))).toEqual([
      'word-2: frame holds left, an -ed inflection no structure admits',
    ])
  })

  it('fails a structure admitted by a lesson the curriculum does not list', () => {
    const structures = [...lessonOneStructures, structureOf('lesson-9', [], ['-ed'])]

    expect(checkGrammar(contentOf({ structures }))).toEqual([
      'structure "Grammar of lesson-9" is admitted by lesson-9, which the curriculum does not list',
    ])
  })

  it('fails a structure listed after one a later lesson admits', () => {
    const structures = [structureOf('lesson-2', [], ['-ed']), ...lessonOneStructures]

    expect(checkGrammar(afterLessonOne(structures, newHome))).toEqual([
      'structure "Grammar of lesson-1" is admitted by lesson-1, before a structure listed above it',
    ])
  })

  it('fails an inflection listed by two structures', () => {
    const structures = [...lessonOneStructures, structureOf('lesson-1', [], ['my'])]

    expect(checkGrammar(contentOf({ structures }))).toEqual([
      'inflection my is listed more than once',
    ])
  })

  it('fails an inflection that is neither a form of a frame word nor a card-word ending', () => {
    const structures = [...lessonOneStructures, structureOf('lesson-1', [], ['-ly', 'homes', 'be'])]

    expect(checkGrammar(contentOf({ structures }))).toEqual([
      'structure "Grammar of lesson-1" lists -ly, which is neither a form of a frame word nor -s, -ed, -ing, -er or -est',
      'structure "Grammar of lesson-1" lists homes, which is neither a form of a frame word nor -s, -ed, -ing, -er or -est',
      'structure "Grammar of lesson-1" lists be, which is neither a form of a frame word nor -s, -ed, -ing, -er or -est',
    ])
  })

  it('passes a later frame using an inflection the lesson it is written for admits', () => {
    expect(checkGrammar(ourHomeFrom('lesson-3'))).toEqual([])
  })

  it('fails a later frame using an inflection admitted after the lesson it is written for', () => {
    expect(checkGrammar(ourHomeFrom('lesson-2'))).toEqual([
      'lesson-1-1, later frame for lesson-2: frame holds our, an inflection admitted after lesson-2',
    ])
  })
})
