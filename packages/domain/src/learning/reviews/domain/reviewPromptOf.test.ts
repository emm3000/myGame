import { assert, describe, expect, it } from 'vitest'
import { MemoryCard, type StoredMemoryCard } from '#memory/domain/MemoryCard'
import { Instant } from '#time/Instant'
import { inMemoryBands } from '../../curriculum/testing/inMemoryBands'
import { inMemoryLessons } from '../../curriculum/testing/inMemoryLessons'
import { lessonOne } from '../../curriculum/testing/lessonOne'
import { townLessonTwo } from '../../curriculum/testing/townLessonTwo'
import { unitLessonOne } from '../../curriculum/testing/unitLessonOne'
import type { HeldCard } from '../../domain/HeldCard'
import { heldCardsOf } from '../../domain/HeldCards'
import type { Lesson, LessonWord } from '../../domain/Lesson'
import type { FrameLearner } from '../../frames/domain/FrameLearner'
import type { FrameToken } from '../../frames/domain/FrameToken'
import { inMemoryFrames, type ResolvedFrame } from '../../frames/testing/inMemoryFrames'
import type { Scaffold } from '../../scaffold/domain/Scaffold'
import { reviewPromptOf } from './reviewPromptOf'

const enteredAt = Instant.fromEpochMilliseconds(Date.parse('2026-11-10T09:00:00Z'))

const enteredCard = MemoryCard.entered(enteredAt)

const learningCardPastADefinition = (): MemoryCard => {
  const stored = {
    state: 'learning',
    step: 1,
    stability: 31,
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

const tokensAround = (school: FrameToken): ResolvedFrame['tokens'] => [
  { text: 'My ', wordId: null },
  { text: 'home', wordId: 'home' },
  { text: ' is by the ', wordId: null },
  school,
  { text: ' in ', wordId: null },
  { text: 'town', wordId: 'town' },
  { text: '.', wordId: null },
]

const findOutGappedFrame = 'We will ____ ____ on the map.'

const findOutGappedFrameWithFind = 'We will ____ ____ what they find.'

const resolvedFrames: ReadonlyArray<ResolvedFrame> = [
  {
    wordId: 'school',
    frame: schoolFrame,
    tokens: tokensAround({ text: 'school', wordId: 'school' }),
  },
  {
    wordId: 'school',
    frame: schoolGappedFrame,
    tokens: tokensAround({ text: '____', wordId: null }),
  },
  {
    wordId: 'find-out',
    frame: findOutGappedFrame,
    tokens: [
      { text: 'We will ____ ____ on the ', wordId: null },
      { text: 'map', wordId: 'map' },
      { text: '.', wordId: null },
    ],
  },
  {
    wordId: 'find-out',
    frame: findOutGappedFrameWithFind,
    tokens: [
      { text: 'We will ____ ____ what they ', wordId: null },
      { text: 'find', wordId: 'find-out' },
      { text: '.', wordId: null },
    ],
  },
]

const answerForms = new Map([
  ['school', new Set(['school', 'schools'])],
  ['find-out', new Set(['find', 'finds', 'found', 'finding', 'out'])],
])

const learnerOf = (
  scaffold: Scaffold,
  cards: ReadonlyArray<HeldCard> = lessonCards,
): FrameLearner => ({
  cards: heldCardsOf(cards),
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
  const prompt = reviewPromptOf(recognitionOfSchool, learnerOf(scaffold))
  assert(prompt.mode === 'recognition')
  return prompt.choices.map(({ gloss }) => gloss).sort()
}

const supportedOf = (
  spans: ReadonlyArray<{ readonly text: string; readonly support: unknown }>,
): ReadonlyArray<string> => spans.filter(({ support }) => support !== null).map(({ text }) => text)

describe('reviewPromptOf', () => {
  it('shows a recognition with the word and the glosses of the lesson under es', () => {
    const prompt = reviewPromptOf(recognitionOfSchool, learnerOf('es'))

    assert(prompt.mode === 'recognition')
    expect(prompt.word).toBe('school')
    expect(offeredGlosses('es')).toEqual(['comida', 'dinero', 'escuela', 'hogar', 'trabajar'])
  })

  it('shows a recognition frame as the spans of its stored frame', () => {
    const prompt = reviewPromptOf(recognitionOfSchool, learnerOf('es'))

    assert(prompt.mode === 'recognition')
    expect(prompt.frame.map(({ text }) => text).join('')).toBe('My home is by the school in town.')
  })

  it('never supports a token whose support equals a choice on a recognition', () => {
    const prompt = reviewPromptOf(recognitionOfSchool, learnerOf('es'))

    assert(prompt.mode === 'recognition')
    expect(supportedOf(prompt.frame)).toEqual(['town'])
  })

  it('never supports the reviewed word on a recognition, even by a support no choice shows', () => {
    const card = learningCardPastADefinition()
    const cards = lessonCards.map((held) => (held.wordId === 'school' ? { ...held, card } : held))
    const prompt = reviewPromptOf({ ...recognitionOfSchool, card }, learnerOf('es', cards))

    assert(prompt.mode === 'recognition')
    expect(prompt.frame.find(({ text }) => text === 'school')?.support).toBeNull()
  })

  it('shows a recall with the gloss and the gapped frame under es', () => {
    const prompt = reviewPromptOf(recallOfSchool, learnerOf('es'))

    assert(prompt.mode === 'recall')
    expect(prompt.gloss).toBe('escuela')
    expect(prompt.gappedFrame.map(({ text }) => text).join('')).toBe(
      'My home is by the ____ in town.',
    )
  })

  it('supports a recall frame by its neighbours', () => {
    const prompt = reviewPromptOf(recallOfSchool, learnerOf('es'))

    assert(prompt.mode === 'recall')
    expect(supportedOf(prompt.gappedFrame)).toEqual(['home', 'town'])
  })

  it('drops a support holding find on a recall of find out', () => {
    const prompt = reviewPromptOf(recallOfFindOut, learnerOf('none', []))

    assert(prompt.mode === 'recall')
    expect(prompt.gappedFrame.map(({ support }) => support)).toEqual([null, null, null])
  })

  it('never supports a word of the recalled unit outside its gap', () => {
    const shown = { ...recallOfFindOut, shownFrame: findOutGappedFrameWithFind }
    const prompt = reviewPromptOf(shown, learnerOf('es', []))

    assert(prompt.mode === 'recall')
    expect(supportedOf(prompt.gappedFrame)).toEqual([])
  })

  it('keeps a support holding no form of the answer on a recall', () => {
    const prompt = reviewPromptOf(recallOfFindOut, learnerOf('es', []))

    assert(prompt.mode === 'recall')
    expect(supportedOf(prompt.gappedFrame)).toEqual(['map'])
  })

  it('answers an unmatched stored frame as one span', () => {
    const stale = { ...recallOfSchool, shownFrame: 'I walk to ____ every day.' }
    const prompt = reviewPromptOf(stale, learnerOf('es'))

    assert(prompt.mode === 'recall')
    expect(prompt.gappedFrame).toEqual([{ text: 'I walk to ____ every day.', support: null }])
  })

  it('uses definitions as recognition choices and recall cue under none', () => {
    const recall = reviewPromptOf(recallOfSchool, learnerOf('none'))

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
