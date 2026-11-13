import { assert, describe, expect, it } from 'vitest'
import { MemoryCard, type StoredMemoryCard } from '../memory/MemoryCard'
import { inMemoryBands } from '../testing/inMemoryBands'
import { inMemoryFrames, type ResolvedFrame } from '../testing/inMemoryFrames'
import { inMemoryLessons } from '../testing/inMemoryLessons'
import { lessonOne } from '../testing/lessonOne'
import { townLessonTwo } from '../testing/townLessonTwo'
import { unitLessonOne } from '../testing/unitLessonOne'
import { Instant } from '../time/Instant'
import type { FrameReader } from './FrameReader'
import type { HeldCard } from './HeldCard'
import type { Lesson, LessonWord } from './Lesson'
import { reviewPromptOf } from './reviewPromptOf'
import type { Scaffold } from './Scaffold'

const enteredAt = Instant.fromEpochMilliseconds(Date.parse('2026-11-10T09:00:00Z'))

const enteredCard = MemoryCard.entered(enteredAt)

const cardInReview = (): MemoryCard => {
  const stored = {
    state: 'review',
    step: null,
    stability: 3.1,
    difficulty: 2.0975,
    lastReviewAt: Instant.fromEpochMilliseconds(Date.parse('2026-11-12T09:10:00Z')),
    lastRating: 'good',
    enteredAt,
    retainedAt: null,
  } as StoredMemoryCard
  const card = MemoryCard.restore(stored)
  assert(card.ok)
  return card.value
}

const lessonCards: ReadonlyArray<HeldCard> = lessonOne.words.map(({ id }) => ({
  wordId: id,
  card: enteredCard,
}))

const wordOf = (lesson: Lesson, id: string): LessonWord => {
  const word = lesson.words.find((candidate) => candidate.id === id)
  assert(word !== undefined)
  return word
}

const school = wordOf(lessonOne, 'school')

const schoolFrame = 'My home is by the school in town.'

const schoolGappedFrame = 'My home is by the ____ in town.'

const tokensAround = (school: string): ResolvedFrame['tokens'] => [
  { text: 'My ', wordId: null },
  { text: 'home', wordId: 'home' },
  { text: ' is by the ', wordId: null },
  { text: school, wordId: null },
  { text: ' in ', wordId: null },
  { text: 'town', wordId: 'town' },
  { text: '.', wordId: null },
]

const findOutGappedFrame = 'We will ____ ____ on the map.'

const resolvedFrames: ReadonlyArray<ResolvedFrame> = [
  { wordId: 'school', frame: schoolFrame, tokens: tokensAround('school') },
  { wordId: 'school', frame: schoolGappedFrame, tokens: tokensAround('____') },
  {
    wordId: 'find-out',
    frame: findOutGappedFrame,
    tokens: [
      { text: 'We will ____ ____ on the ', wordId: null },
      { text: 'map', wordId: 'map' },
      { text: '.', wordId: null },
    ],
  },
]

const answerForms = new Map([
  ['school', new Set(['school', 'schools'])],
  ['find-out', new Set(['find', 'finds', 'found', 'finding', 'out'])],
])

const readerOf = (
  scaffold: Scaffold,
  cards: ReadonlyArray<HeldCard> = lessonCards,
): FrameReader => ({
  cards,
  placedOutBands: [],
  scaffold,
  lessons: {
    ...inMemoryLessons([lessonOne, townLessonTwo, unitLessonOne], []),
    ...inMemoryBands([]),
    ...inMemoryFrames(resolvedFrames, answerForms),
  },
})

const recognitionOfSchool = {
  lesson: lessonOne,
  word: school,
  card: enteredCard,
  shownFrame: schoolFrame,
}

const recallOfSchool = {
  ...recognitionOfSchool,
  card: cardInReview(),
  shownFrame: schoolGappedFrame,
}

const recallOfFindOut = {
  lesson: unitLessonOne,
  word: wordOf(unitLessonOne, 'find-out'),
  card: cardInReview(),
  shownFrame: findOutGappedFrame,
}

const offeredGlosses = (scaffold: Scaffold): ReadonlyArray<string> => {
  const prompt = reviewPromptOf(recognitionOfSchool, readerOf(scaffold))
  assert(prompt.mode === 'recognition')
  return prompt.choices.map(({ gloss }) => gloss).sort()
}

const supportedOf = (
  spans: ReadonlyArray<{ readonly text: string; readonly support: unknown }>,
): ReadonlyArray<string> => spans.filter(({ support }) => support !== null).map(({ text }) => text)

describe('reviewPromptOf', () => {
  it('shows a recognition with the word and the glosses of the lesson under es', () => {
    const prompt = reviewPromptOf(recognitionOfSchool, readerOf('es'))

    assert(prompt.mode === 'recognition')
    expect(prompt.word).toBe('school')
    expect(offeredGlosses('es')).toEqual(['comida', 'dinero', 'escuela', 'hogar', 'trabajar'])
  })

  it('shows a recognition frame as the spans of its stored frame', () => {
    const prompt = reviewPromptOf(recognitionOfSchool, readerOf('es'))

    assert(prompt.mode === 'recognition')
    expect(prompt.frame.map(({ text }) => text).join('')).toBe('My home is by the school in town.')
  })

  it('never supports a token whose support equals a choice on a recognition', () => {
    const prompt = reviewPromptOf(recognitionOfSchool, readerOf('es'))

    assert(prompt.mode === 'recognition')
    expect(supportedOf(prompt.frame)).toEqual(['town'])
  })

  it('shows a recall with the gloss and the gapped frame under es', () => {
    const prompt = reviewPromptOf(recallOfSchool, readerOf('es'))

    assert(prompt.mode === 'recall')
    expect(prompt.gloss).toBe('escuela')
    expect(prompt.gappedFrame.map(({ text }) => text).join('')).toBe(
      'My home is by the ____ in town.',
    )
  })

  it('supports a recall frame by its neighbours', () => {
    const prompt = reviewPromptOf(recallOfSchool, readerOf('es'))

    assert(prompt.mode === 'recall')
    expect(supportedOf(prompt.gappedFrame)).toEqual(['home', 'town'])
  })

  it('drops a support holding find on a recall of find out', () => {
    const prompt = reviewPromptOf(recallOfFindOut, readerOf('none', []))

    assert(prompt.mode === 'recall')
    expect(prompt.gappedFrame.map(({ support }) => support)).toEqual([null, null, null])
  })

  it('keeps a support holding no form of the answer on a recall', () => {
    const prompt = reviewPromptOf(recallOfFindOut, readerOf('es', []))

    assert(prompt.mode === 'recall')
    expect(supportedOf(prompt.gappedFrame)).toEqual(['map'])
  })

  it('answers an unmatched stored frame as one span', () => {
    const stale = { ...recallOfSchool, shownFrame: 'I walk to ____ every day.' }
    const prompt = reviewPromptOf(stale, readerOf('es'))

    assert(prompt.mode === 'recall')
    expect(prompt.gappedFrame).toEqual([{ text: 'I walk to ____ every day.', support: null }])
  })

  it('uses definitions as recognition choices and recall cue under none', () => {
    const recall = reviewPromptOf(recallOfSchool, readerOf('none'))

    assert(recall.mode === 'recall')
    expect({ choices: offeredGlosses('none'), cue: recall.gloss }).toEqual({
      choices: [
        'a place where children learn',
        'the place where you live',
        'to do a job for money',
        'what you eat',
        'what you pay with',
      ],
      cue: 'a place where children learn',
    })
  })
})
