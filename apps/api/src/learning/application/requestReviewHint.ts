import {
  type DomainError,
  type Hint,
  mutateTown,
  type PlayerId,
  type Result,
  requestHint,
  type WordId,
} from '@mygame/domain'
import type { LearningDependencies } from './LearningDependencies'

export const requestReviewHint = (
  playerId: PlayerId,
  wordId: WordId,
  dependencies: LearningDependencies,
): Promise<Result<Hint, DomainError>> =>
  mutateTown(
    playerId,
    ({ cards, pendingReviews }, clock) =>
      requestHint(
        { playerId, wordId },
        {
          cards,
          pendingReviews,
          lessons: dependencies.lessons,
          clock,
          terms: dependencies.memoryTerms,
        },
      ),
    dependencies,
  )
