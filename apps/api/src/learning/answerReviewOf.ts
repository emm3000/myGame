import {
  type AnsweredReview,
  answerReview,
  type DomainError,
  err,
  type LessonWord,
  ok,
  type PlayerId,
  type Result,
  type WordId,
} from '@mygame/domain'
import type { Town, TownSkill } from '@mygame/domain/town'
import { mutateTown } from '../town/mutateTown'
import type { LearningDependencies } from './LearningDependencies'

export type ReviewOutcome = {
  readonly answered: AnsweredReview
  readonly word: LessonWord
  readonly skills: ReadonlyArray<TownSkill>
  readonly town: Town | undefined
}

export const answerReviewOf = (
  playerId: PlayerId,
  wordId: WordId,
  answer: string,
  dependencies: LearningDependencies,
): Promise<Result<ReviewOutcome, DomainError>> =>
  mutateTown(
    playerId,
    async (stores, clock) => {
      const { lessons, memoryTerms, townCatalog } = dependencies
      const answered = await answerReview(
        { playerId, wordId, answer },
        {
          cards: stores.cards,
          pendingReviews: stores.pendingReviews,
          reviewLog: stores.reviewLog,
          lessons,
          clock,
          terms: memoryTerms,
          skills: stores.earnedSkills,
          towns: stores.towns,
          news: stores.townNews,
          catalog: townCatalog,
        },
      )
      if (!answered.ok) {
        return answered
      }
      const word = lessons.lessonOfWord(wordId)?.words.find(({ id }) => id === wordId)
      if (word === undefined) {
        return err({ kind: 'UnknownWord', wordId })
      }
      const skills = await stores.earnedSkills.skillsOf(playerId)
      if (!skills.ok) {
        return skills
      }
      const town = await stores.towns.townOf(playerId)
      if (!town.ok) {
        return town
      }
      return ok({ answered: answered.value, word, skills: skills.value, town: town.value })
    },
    dependencies,
  )
