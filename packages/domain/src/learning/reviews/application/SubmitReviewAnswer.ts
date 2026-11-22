import { readScaffold } from '#account/application/readScaffold'
import type { LessonLibrary } from '#content/domain/LessonLibrary'
import type { DomainError } from '#DomainError'
import type { MemoryTerms } from '#memory/domain/MemoryTerms'
import type { PlayerId } from '#player/PlayerId'
import { err, ok, type Result } from '#Result'
import { type MutateTownDependencies, mutateTown } from '#town/application/mutateTown'
import type { TownCatalog } from '#town/domain/TownCatalog'
import type { TownSkill } from '#town/domain/TownSkill'
import type { CardRepository } from '../../domain/CardRepository'
import type { WordId } from '../../domain/Lesson'
import type { ReviewOutcome } from '../domain/ReviewOutcome'
import { answerReview } from './answerReview'

export type SubmitReviewAnswerCommand = {
  readonly playerId: PlayerId
  readonly wordId: WordId
  readonly answer: string
}

export type SubmitReviewAnswerDependencies = MutateTownDependencies & {
  readonly lessons: LessonLibrary
  readonly memoryTerms: MemoryTerms
  readonly townCatalog: TownCatalog
}

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

export class SubmitReviewAnswer {
  constructor(private readonly dependencies: SubmitReviewAnswerDependencies) {}

  async execute({
    playerId,
    wordId,
    answer,
  }: SubmitReviewAnswerCommand): Promise<Result<ReviewOutcome, DomainError>> {
    const { lessons, memoryTerms, townCatalog } = this.dependencies
    return mutateTown(
      playerId,
      async (stores, clock) => {
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
        const scaffold = await readScaffold(playerId, stores.accounts)
        if (!scaffold.ok) {
          return scaffold
        }
        return ok({
          answered: answered.value,
          word,
          scaffold: scaffold.value,
          skills: skills.value,
          town: town.value,
          skillWords: skillWords.value,
        })
      },
      this.dependencies,
    )
  }
}
