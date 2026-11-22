import type { DomainError } from '#DomainError'
import type { MemoryTerms } from '#memory/domain/MemoryTerms'
import type { Clock } from '#platform/domain/Clock'
import type { PlayerId } from '#player/PlayerId'
import { err, ok, type Result } from '#Result'
import type { LessonCatalog } from '../../curriculum/domain/LessonCatalog'
import type { CardRepository } from '../../domain/CardRepository'
import type { WordId } from '../../domain/Lesson'
import { admitDueReview } from '../domain/admitDueReview'
import { freshPendingReview } from '../domain/freshPendingReview'
import { normalizedAnswerOf } from '../domain/normalizedAnswerOf'
import type { PendingReviewRepository } from '../domain/PendingReviewRepository'
import { reviewFormatOf } from '../domain/ReviewFormat'

export type RequestHintCommand = {
  readonly playerId: PlayerId
  readonly wordId: WordId
}

export type RequestHintDependencies = {
  readonly cards: Pick<CardRepository, 'cardsOf'>
  readonly pendingReviews: PendingReviewRepository
  readonly lessons: LessonCatalog
  readonly clock: Clock
  readonly terms: MemoryTerms
}

export type WordHint = {
  readonly firstLetter: string
  readonly letterCount: number
}

export type Hint = {
  readonly words: ReadonlyArray<WordHint>
}

const wordHintOf = (word: string): WordHint => {
  const letters = [...word]
  return { firstLetter: letters.slice(0, 1).join(''), letterCount: letters.length }
}

const hintOf = (form: string): Hint => ({
  words: normalizedAnswerOf(form).split(' ').map(wordHintOf),
})

export const requestHint = async (
  { playerId, wordId }: RequestHintCommand,
  { cards, pendingReviews, lessons, clock, terms }: RequestHintDependencies,
): Promise<Result<Hint, DomainError>> => {
  const held = await cards.cardsOf(playerId)
  if (!held.ok) {
    return held
  }
  const review = admitDueReview(
    wordId,
    lessons.lessonOfWord(wordId),
    held.value,
    clock.now(),
    terms,
  )
  if (!review.ok) {
    return review
  }
  if (reviewFormatOf(review.value.held.card) === 'recognition') {
    return err({ kind: 'HintOnRecognition', wordId })
  }
  const pending = await pendingReviews.pendingReviewOf(playerId, wordId)
  const marked = await pendingReviews.save(playerId, wordId, {
    ...(pending ?? freshPendingReview),
    hintShown: true,
  })
  if (!marked.ok) {
    return marked
  }
  return ok(hintOf(review.value.word.acceptedForms[0]))
}
