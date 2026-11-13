import {
  type AnsweredReview,
  answerReview,
  type CardRepository,
  type DomainError,
  err,
  type LessonWord,
  ok,
  type PlayerId,
  type Result,
  type Scaffold,
  type Town,
  type TownSkill,
  type WordId,
} from '@mygame/domain'
import { mutateTown } from '../town/mutateTown'
import type { LearningDependencies } from './LearningDependencies'
import type { LessonLibrary } from './LessonLibrary'
import { scaffoldOf } from './scaffoldOf'

export type ReviewOutcome = {
  readonly answered: AnsweredReview
  readonly word: LessonWord
  readonly scaffold: Scaffold
  readonly skills: ReadonlyArray<TownSkill>
  readonly town: Town | undefined
  readonly skillWords: ReadonlyArray<string>
}

const heldWordsOf = async (
  playerId: PlayerId,
  earnedSkill: TownSkill | undefined,
  cards: CardRepository,
  lessons: LessonLibrary,
): Promise<Result<ReadonlyArray<string>, DomainError>> => {
  const lesson = earnedSkill === undefined ? undefined : lessons.lessonOf(earnedSkill.lessonId)
  if (lesson === undefined) {
    return ok([])
  }
  const held = await cards.cardsOf(playerId)
  if (!held.ok) {
    return held
  }
  const heldWordIds = new Set(held.value.map(({ wordId }) => wordId))
  return ok(
    lesson.words
      .filter(({ id }) => heldWordIds.has(id))
      .map(({ acceptedForms }) => acceptedForms[0]),
  )
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
          bands: lessons,
          bandStarts: stores.bandStarts,
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
      const earnedSkill = answered.value.kind === 'rated' ? answered.value.earnedSkill : undefined
      const skillWords = await heldWordsOf(playerId, earnedSkill, stores.cards, lessons)
      if (!skillWords.ok) {
        return skillWords
      }
      return ok({
        answered: answered.value,
        word,
        scaffold: await scaffoldOf(playerId, stores.accounts),
        skills: skills.value,
        town: town.value,
        skillWords: skillWords.value,
      })
    },
    dependencies,
  )
