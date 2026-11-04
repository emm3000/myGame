import {
  type AnsweredReview,
  answerReview,
  type DomainError,
  err,
  type FiefOfPlayer,
  type LessonWord,
  ok,
  type Result,
  type WordId,
} from '@mygame/domain'
import type { FiefReading } from '../fief/FiefReading'
import { fiefReadingAt } from '../fief/fiefReadingAt'
import { mutateEveryFiefAfterResolve } from '../fief/mutateEveryFiefAfterResolve'
import type { LearningDependencies } from './LearningDependencies'

export type ReviewOutcome = {
  readonly answered: AnsweredReview
  readonly word: LessonWord
  readonly reading: FiefReading
}

export const answerReviewOf = async (
  fiefOfPlayer: FiefOfPlayer,
  wordId: WordId,
  answer: string,
  dependencies: LearningDependencies,
): Promise<Result<ReviewOutcome, DomainError>> =>
  mutateEveryFiefAfterResolve(
    fiefOfPlayer,
    async ({ fiefs, cards, pendingReviews, reviewLog }, clock) => {
      const { lessons, buildingCatalog, memoryTerms } = dependencies
      const answered = await answerReview(
        { playerId: fiefOfPlayer.playerId, wordId, answer },
        {
          fiefs,
          catalog: buildingCatalog,
          cards,
          pendingReviews,
          reviewLog,
          lessons,
          clock,
          terms: memoryTerms,
        },
      )
      if (!answered.ok) {
        return answered
      }
      const word = lessons.lessonOfWord(wordId)?.words.find(({ id }) => id === wordId)
      if (word === undefined) {
        return err({ kind: 'UnknownWord', wordId })
      }
      const stored = await fiefs.fiefOf(fiefOfPlayer.fiefId)
      if (!stored.ok) {
        return stored
      }
      if (stored.value === undefined) {
        return err({ kind: 'FiefNotFound', fiefId: fiefOfPlayer.fiefId })
      }
      const reading = fiefReadingAt(stored.value, buildingCatalog, clock.now())
      if (!reading.ok) {
        return reading
      }
      return ok({ answered: answered.value, word, reading: reading.value })
    },
    dependencies,
  )
