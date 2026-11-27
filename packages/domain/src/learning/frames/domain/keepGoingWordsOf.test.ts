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
import { inMemoryFrames, type ResolvedFrame } from '../testing/inMemoryFrames'
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

const fixtureDayStart = Instant.fromEpochMilliseconds(Date.parse('2026-11-12T00:00:00Z'))

const fixtureDayEnd = Instant.fromEpochMilliseconds(Date.parse('2026-11-12T23:59:59.999Z'))

const cardsDueInDueOrder = ['home', 'school', 'work', 'money', 'food'].map((wordId, index) =>
  reviewedCard(wordId, hoursBeforeRead(24), 10 * (index + 1)),
)

const aDayAfterRead = hoursBeforeRead(-24)

const lowerOfEqualHash = 'word-121498'

const higherOfEqualHash = 'word-376770'

const wordWithId = (id: string): LessonWord => ({
  id,
  acceptedForms: [id],
  gloss: id,
  definition: id,
  frames: [{ frame: `We read ${id} today.`, gappedFrame: 'We read ____ today.' }],
})

const lessonOfEqualHash: Lesson = {
  ...lessonOne,
  words: [wordWithId(lowerOfEqualHash), wordWithId(higherOfEqualHash)],
}

const homeInItsAnchor: ResolvedFrame = {
  wordId: 'home',
  frame: anchorOfHome.frame,
  tokens: [
    { text: 'We have a new ', wordId: null },
    { text: 'home', wordId: 'home' },
    { text: ' in this town.', wordId: null },
  ],
}

const findOut: LessonWord = {
  id: 'find-out',
  acceptedForms: ['find out'],
  gloss: 'averiguar',
  definition: 'to learn something you did not know',
  frames: [
    {
      frame: 'Can you find out what time the office closes?',
      gappedFrame: 'Can you ____ ____ what time the office closes?',
    },
  ],
}

const lessonOfFindOut: Lesson = { ...lessonOne, id: 'lesson-27', words: [findOut] }

const findOutInItsAnchor: ResolvedFrame = {
  wordId: 'find-out',
  frame: 'Can you find out what time the office closes?',
  tokens: [
    { text: 'Can you ', wordId: null },
    { text: 'find', wordId: 'find-out' },
    { text: ' ', wordId: null },
    { text: 'out', wordId: 'find-out' },
    { text: ' what time the office closes?', wordId: null },
  ],
}

const keepGoingTerms: KeepGoingTerms = { wordsPerRead: 10, secondsBeforeDue: 86_400 }

type Read = {
  readonly cards: ReadonlyArray<HeldCard>
  readonly lessons?: ReadonlyArray<Lesson>
  readonly frames?: ReadonlyArray<ResolvedFrame>
  readonly stage?: Stage
  readonly terms?: KeepGoingTerms
  readonly at?: Instant
}

const keepGoingOf = ({
  cards,
  lessons = [lessonOne],
  frames = [],
  stage = ['lesson-1'],
  terms = keepGoingTerms,
  at = readAt,
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
        ...inMemoryFrames(frames, new Map()),
      },
    },
    at,
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

  it('answers the same words in the same order all day for the same cards', () => {
    const reversed = cardsDueInDueOrder.toReversed()

    const atDayStart = offeredWordIdsOf({ cards: cardsDueInDueOrder, at: fixtureDayStart })
    const atDayEnd = offeredWordIdsOf({ cards: reversed, at: fixtureDayEnd })

    expect(atDayEnd).toEqual(atDayStart)
    expect(atDayStart).toEqual(['school', 'money', 'work', 'food', 'home'])
  })

  it('answers the same readable words in another order on another day', () => {
    const today = offeredWordIdsOf({ cards: cardsDueInDueOrder })
    const tomorrow = offeredWordIdsOf({ cards: cardsDueInDueOrder, at: aDayAfterRead })

    expect(tomorrow.toSorted()).toEqual(today.toSorted())
    expect(tomorrow).not.toEqual(today)
  })

  it("answers at most the content's cap of words, the first of the day's order", () => {
    const terms = { ...keepGoingTerms, wordsPerRead: 2 }

    expect(offeredWordIdsOf({ cards: cardsDueInDueOrder, terms })).toEqual(['school', 'money'])
  })

  it('answers the lower word id first between two words of an equal hash on the day', () => {
    const cards = [
      reviewedCard(higherOfEqualHash, hoursBeforeRead(24), 10),
      reviewedCard(lowerOfEqualHash, hoursBeforeRead(24), 20),
    ]

    expect(offeredWordIdsOf({ cards, lessons: [lessonOfEqualHash] })).toEqual([
      lowerOfEqualHash,
      higherOfEqualHash,
    ])
  })

  it("supports the read word's own token by its own card", () => {
    const [offered] = keepGoingOf({ cards: [dueInThreeDays('home')], frames: [homeInItsAnchor] })

    expect(offered?.frames[0][1]).toEqual({
      text: 'home',
      support: { shown: 'beside', text: 'hogar', language: 'es' },
    })
  })

  it('supports no word of a read unit', () => {
    const [offered] = keepGoingOf({
      cards: [dueInThreeDays('find-out')],
      lessons: [lessonOfFindOut],
      frames: [findOutInItsAnchor],
      stage: ['lesson-27'],
    })

    expect(offered?.frames[0].filter(({ support }) => support !== null)).toEqual([])
  })

  it('never offers a word with no card, so never a held-out word', () => {
    expect(offeredWordIdsOf({ cards: [dueInThreeDays('home')] })).toEqual(['home'])
  })
})
