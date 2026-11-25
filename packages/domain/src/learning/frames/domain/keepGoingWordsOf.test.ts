import { assert, describe, expect, it } from 'vitest'
import { MemoryCard } from '#memory/domain/MemoryCard'
import { defaultMemoryTerms } from '#memory/domain/MemoryTerms'
import { Instant } from '#time/Instant'
import type { Stage } from '../../curriculum/domain/stageOf'
import { inMemoryBands } from '../../curriculum/testing/inMemoryBands'
import { inMemoryLessons } from '../../curriculum/testing/inMemoryLessons'
import { lessonOne } from '../../curriculum/testing/lessonOne'
import type { HeldCard } from '../../domain/HeldCard'
import { heldCardsOf } from '../../domain/HeldCards'
import type { LaterFrame, Lesson, LessonWord } from '../../domain/Lesson'
import { inMemoryFrames } from '../testing/inMemoryFrames'
import type { FrameSpans } from './FrameSpan'
import type { KeepGoingTerms } from './KeepGoingTerms'
import { type KeepGoingWord, keepGoingWordsOf } from './keepGoingWordsOf'
import { recallFrameOf } from './recallFrameOf'
import type { WordFrame } from './WordFrame'

const MILLISECONDS_PER_HOUR = 3_600_000

const readAt = Instant.fromEpochMilliseconds(Date.parse('2026-11-12T10:00:00Z'))

const hoursBeforeRead = (hours: number): Instant =>
  Instant.fromEpochMilliseconds(readAt.epochMilliseconds - hours * MILLISECONDS_PER_HOUR)

const enteredAt = hoursBeforeRead(48)

const reviewedCard = (wordId: string, lastReviewAt: Instant, stability: number): HeldCard => {
  const card = MemoryCard.restore({
    state: 'review',
    step: null,
    stability,
    difficulty: 2.0975,
    lastReviewAt,
    lastRating: 'good',
    enteredAt,
    retainedAt: null,
  })
  assert(card.ok)
  return { wordId, card: card.value }
}

const dueInThreeDays = (wordId: string): HeldCard => reviewedCard(wordId, readAt, 3)

const anchorOfHome: WordFrame = {
  frame: 'We have a new home in this town.',
  gappedFrame: 'We have a new ____ in this town.',
}

const laterFrameFrom = (lessonId: string, frame: string): LaterFrame => ({
  frame,
  gappedFrame: frame.replace('home', '____'),
  fromLessonId: lessonId,
})

const frameForLessonTwo = laterFrameFrom('lesson-2', 'My home is near the school.')

const frameForLessonThree = laterFrameFrom('lesson-3', 'They work at home every week.')

const frameForLessonFour = laterFrameFrom('lesson-4', 'Her home has a red door.')

const homeWithLaterFrames: LessonWord = {
  id: 'home',
  acceptedForms: ['home'],
  gloss: 'hogar',
  definition: 'the place where you live',
  frames: [anchorOfHome, frameForLessonTwo, frameForLessonThree, frameForLessonFour],
}

const lessonWithLaterFrames: Lesson = { ...lessonOne, words: [homeWithLaterFrames] }

const textOf = (spans: FrameSpans): string => spans.map(({ text }) => text).join('')

const keepGoingTerms: KeepGoingTerms = { wordsPerRead: 10, secondsBeforeDue: 86_400 }

type Read = {
  readonly cards: ReadonlyArray<HeldCard>
  readonly lessons?: ReadonlyArray<Lesson>
  readonly stage?: Stage
  readonly terms?: KeepGoingTerms
}

const keepGoingOf = ({
  cards,
  lessons = [lessonOne],
  stage = ['lesson-1'],
  terms = keepGoingTerms,
}: Read): ReadonlyArray<KeepGoingWord> => {
  const read = keepGoingWordsOf(
    {
      cards: heldCardsOf(cards),
      placedOutBands: [],
      scaffold: 'es',
      stage,
      lessons: {
        ...inMemoryLessons(lessons, []),
        ...inMemoryBands([]),
        ...inMemoryFrames([], new Map()),
      },
    },
    readAt,
    { memory: defaultMemoryTerms, keepGoing: terms },
  )
  assert(read.ok)
  return read.value
}

const offeredWordIdsOf = (read: Read): ReadonlyArray<string> =>
  keepGoingOf(read).map(({ wordId }) => wordId)

describe('keepGoingWordsOf', () => {
  it('offers a word from its first review on while its next review is a day or more away', () => {
    const cards = [
      dueInThreeDays('home'),
      reviewedCard('school', hoursBeforeRead(1), 1),
      { wordId: 'work', card: MemoryCard.entered(enteredAt) },
      reviewedCard('money', readAt, 1),
    ]

    expect(offeredWordIdsOf({ cards }).toSorted()).toEqual(['home', 'money'])
  })

  it('offers the anchor and the later frames the stage admits, except the one its next recall shows', () => {
    const card = dueInThreeDays('home')
    const stage = ['lesson-1', 'lesson-2', 'lesson-3']
    const recalled = recallFrameOf(homeWithLaterFrames, card.card, stage)
    assert(recalled !== anchorOfHome)
    const other = recalled === frameForLessonTwo ? frameForLessonThree : frameForLessonTwo

    const [offered] = keepGoingOf({ cards: [card], lessons: [lessonWithLaterFrames], stage })

    expect(offered?.frames.map(textOf)).toEqual([anchorOfHome.frame, other.frame])
  })

  it('keeps the anchor while the stage admits no later frame', () => {
    const [offered] = keepGoingOf({
      cards: [dueInThreeDays('home')],
      lessons: [lessonWithLaterFrames],
    })

    expect(offered?.frames.map(textOf)).toEqual([anchorOfHome.frame])
  })

  it('answers at most the cap of words, the soonest due first', () => {
    const cards = [
      dueInThreeDays('home'),
      reviewedCard('school', readAt, 1),
      reviewedCard('work', readAt, 2),
    ]
    const terms = { ...keepGoingTerms, wordsPerRead: 2 }

    expect(offeredWordIdsOf({ cards, terms })).toEqual(['school', 'work'])
  })

  it('never offers a word with no card, so never a held-out word', () => {
    expect(offeredWordIdsOf({ cards: [dueInThreeDays('home')] })).toEqual(['home'])
  })
})
