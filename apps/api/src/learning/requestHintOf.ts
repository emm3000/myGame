import {
  type DomainError,
  type FiefOfPlayer,
  type Hint,
  type Result,
  requestHint,
  type WordId,
} from '@mygame/domain'
import { mutateEveryFiefAfterResolve } from '../fief/mutateEveryFiefAfterResolve'
import type { LearningDependencies } from './LearningDependencies'

export const requestHintOf = async (
  fiefOfPlayer: FiefOfPlayer,
  wordId: WordId,
  dependencies: LearningDependencies,
): Promise<Result<Hint, DomainError>> =>
  mutateEveryFiefAfterResolve(
    fiefOfPlayer,
    ({ cards, pendingReviews }, clock) =>
      requestHint(
        { playerId: fiefOfPlayer.playerId, wordId },
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
