import type { DomainError } from '#DomainError'
import { dueInstantOf } from '#memory/domain/dueInstantOf'
import type { MemoryTerms } from '#memory/domain/MemoryTerms'
import { ok, type Result } from '#Result'
import type { Instant } from '#time/Instant'
import type { Stage } from '../../curriculum/domain/stageOf'
import { compareWordIds } from '../../domain/compareWordIds'
import type { HeldCard } from '../../domain/HeldCard'
import type { LessonWord, WordId } from '../../domain/Lesson'
import type { DueCard } from '../../reviews/domain/dueCardsAt'
import type { FrameLearner } from './FrameLearner'
import type { FrameSpans } from './FrameSpan'
import { frameSpansOf, withholdingNothing } from './frameSpansOf'
import type { KeepGoingTerms } from './KeepGoingTerms'
import { recallFrameOf } from './recallFrameOf'
import type { WordFrame } from './WordFrame'

const MILLISECONDS_PER_SECOND = 1_000

export type KeepGoingLearner = FrameLearner & {
  readonly stage: Stage
}

export type KeepGoingWord = {
  readonly wordId: WordId
  readonly frames: readonly [FrameSpans, ...ReadonlyArray<FrameSpans>]
}

export type KeepGoingReadTerms = {
  readonly memory: MemoryTerms
  readonly keepGoing: KeepGoingTerms
}

const lessonWordOf = (wordId: WordId, learner: KeepGoingLearner): LessonWord | undefined =>
  learner.lessons.lessonOfWord(wordId)?.words.find(({ id }) => id === wordId)

const readFramesOf = (
  word: LessonWord,
  { card }: HeldCard,
  stage: Stage,
): readonly [WordFrame, ...ReadonlyArray<WordFrame>] => {
  const [anchor, ...laterFrames] = word.frames
  const recalled = recallFrameOf(word, card, stage)
  return [
    anchor,
    ...laterFrames.filter((frame) => stage.includes(frame.fromLessonId) && frame !== recalled),
  ]
}

const spansOf = (word: LessonWord, { frame }: WordFrame, learner: KeepGoingLearner): FrameSpans =>
  frameSpansOf(frame, learner.lessons.frameTokensOf(word.id, frame), learner, withholdingNothing)

const keepGoingWordOf = (
  word: LessonWord,
  held: HeldCard,
  learner: KeepGoingLearner,
): KeepGoingWord => {
  const [anchor, ...laterFrames] = readFramesOf(word, held, learner.stage)
  return {
    wordId: word.id,
    frames: [
      spansOf(word, anchor, learner),
      ...laterFrames.map((frame) => spansOf(word, frame, learner)),
    ],
  }
}

const byDueThenWord = (left: DueCard, right: DueCard): number =>
  left.dueAt.epochMilliseconds - right.dueAt.epochMilliseconds ||
  compareWordIds(left.wordId, right.wordId)

const readableCardsOf = (
  cards: Iterable<HeldCard>,
  readAt: Instant,
  terms: KeepGoingReadTerms,
): Result<ReadonlyArray<DueCard>, DomainError> => {
  const lineMilliseconds =
    readAt.epochMilliseconds + terms.keepGoing.secondsBeforeDue * MILLISECONDS_PER_SECOND
  const readable: Array<DueCard> = []
  for (const held of cards) {
    const dueAt = dueInstantOf(held.card, terms.memory)
    if (!dueAt.ok) {
      return dueAt
    }
    const isReviewed = held.card.stored.lastReviewAt !== null
    if (isReviewed && dueAt.value.epochMilliseconds >= lineMilliseconds) {
      readable.push({ ...held, dueAt: dueAt.value })
    }
  }
  return ok(readable.sort(byDueThenWord))
}

export const keepGoingWordsOf = (
  learner: KeepGoingLearner,
  readAt: Instant,
  terms: KeepGoingReadTerms,
): Result<ReadonlyArray<KeepGoingWord>, DomainError> => {
  const readable = readableCardsOf(learner.cards.values(), readAt, terms)
  if (!readable.ok) {
    return readable
  }
  const offered = readable.value
    .flatMap((held) => {
      const word = lessonWordOf(held.wordId, learner)
      return word === undefined ? [] : [{ held, word }]
    })
    .slice(0, terms.keepGoing.wordsPerRead)
  return ok(offered.map(({ held, word }) => keepGoingWordOf(word, held, learner)))
}
