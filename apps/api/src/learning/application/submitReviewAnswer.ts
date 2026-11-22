import type { LessonLibrary } from '@mygame/domain'
import {
  answerReview,
  type CardRepository,
  type DomainError,
  err,
  mutateTown,
  ok,
  type PlayerId,
  type Result,
  readScaffold,
  type TownSkill,
  type WordId,
} from '@mygame/domain'
import {
  gatherReviewVerdict,
  type ReviewOutcome,
  type ReviewVerdictView,
} from './gatherReviewVerdict'
import type { LearningDependencies } from './LearningDependencies'

const readHeldWords = async (
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

const recordReviewAnswer = (
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
      const skillWords = await readHeldWords(playerId, earnedSkill, stores.cards, lessons)
      if (!skillWords.ok) {
        return skillWords
      }
      return ok({
        answered: answered.value,
        word,
        scaffold: await readScaffold(playerId, stores.accounts),
        skills: skills.value,
        town: town.value,
        skillWords: skillWords.value,
      })
    },
    dependencies,
  )

export const submitReviewAnswer = async (
  playerId: PlayerId,
  wordId: WordId,
  answer: string,
  dependencies: LearningDependencies,
): Promise<Result<ReviewVerdictView, DomainError>> => {
  const outcome = await recordReviewAnswer(playerId, wordId, answer, dependencies)
  return outcome.ok
    ? gatherReviewVerdict(outcome.value, dependencies.townCatalog, dependencies.memoryTerms)
    : outcome
}
