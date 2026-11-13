import type { DueReview, Reviews } from '@mygame/contracts'
import {
  type Clock,
  type DomainError,
  dueInstantOf,
  type FrameReader,
  type HeldCard,
  type Instant,
  type MemoryTerms,
  ok,
  type PlayerId,
  type Result,
  readFirstOf,
  reviewPromptOf,
  type ShownReview,
  showDueReviews,
  stageOf,
} from '@mygame/domain'
import { isoOf } from '../http/isoOf'
import type { TownStores } from '../town/mutateTown'
import type { LessonLibrary } from './LessonLibrary'
import { learnerOf } from './learnerOf'

export type ReviewTerms = {
  readonly lessons: LessonLibrary
  readonly memoryTerms: MemoryTerms
}

const dueReviewOf = (
  { lesson, word, due, shownFrame }: ShownReview,
  reader: FrameReader,
): DueReview => {
  const asked = { wordId: word.id, lessonId: lesson.id, dueAt: isoOf(due.dueAt) }
  const prompt = reviewPromptOf({ lesson, word, card: due.card, shownFrame }, reader)
  if (prompt.mode === 'recall') {
    return { ...asked, ...prompt, gappedFrame: [...prompt.gappedFrame] }
  }
  return { ...asked, ...prompt, frame: [...prompt.frame], choices: [...prompt.choices] }
}

export const nextDueAtOf = (
  cards: ReadonlyArray<HeldCard>,
  readAt: Instant,
  terms: MemoryTerms,
): Result<Instant | null, DomainError> => {
  let next: Instant | null = null
  for (const { card } of cards) {
    const dueAt = dueInstantOf(card, terms)
    if (!dueAt.ok) {
      return dueAt
    }
    const isLater = dueAt.value.epochMilliseconds > readAt.epochMilliseconds
    if (isLater && (next === null || dueAt.value.epochMilliseconds < next.epochMilliseconds)) {
      next = dueAt.value
    }
  }
  return ok(next)
}

export const reviewsOf = async (
  playerId: PlayerId,
  stores: Pick<TownStores, 'accounts' | 'cards' | 'placements' | 'pendingReviews'>,
  clock: Clock,
  { lessons, memoryTerms }: ReviewTerms,
): Promise<Result<Reviews, DomainError>> => {
  const learner = await learnerOf(playerId, stores)
  if (!learner.ok) {
    return learner
  }
  const { cards, placedOutBands, scaffold } = learner.value
  const shown = await showDueReviews(
    { playerId, cards, stage: stageOf(lessons.lessons(), cards, placedOutBands, lessons) },
    { pendingReviews: stores.pendingReviews, lessons, clock, terms: memoryTerms },
  )
  if (!shown.ok) {
    return shown
  }
  const readAt = clock.now()
  const nextDueAt = nextDueAtOf(cards, readAt, memoryTerms)
  if (!nextDueAt.ok) {
    return nextDueAt
  }
  return ok({
    due: shown.value.map((review) =>
      dueReviewOf(review, { cards, placedOutBands, scaffold, lessons }),
    ),
    readFirst: [
      ...readFirstOf(
        lessons.lessons(),
        shown.value.map(({ due }) => due),
      ),
    ],
    nextDueAt: nextDueAt.value === null ? null : isoOf(nextDueAt.value),
    readAt: isoOf(readAt),
  })
}
