import type { DomainError } from '../../../DomainError'
import type { BandStartRepository } from '../../../holdout/ports/BandStartRepository'
import { type ReleaseContent, releasedLessonsOf } from '../../../holdout/releasedLessonsOf'
import type { MemoryCard } from '../../../memory/MemoryCard'
import type { MemoryTerms } from '../../../memory/MemoryTerms'
import { reviewMemoryCard } from '../../../memory/reviewMemoryCard'
import type { PlayerId } from '../../../player/PlayerId'
import type { Clock } from '../../../ports/Clock'
import { ok, type Result } from '../../../Result'
import type { Instant } from '../../../time/Instant'
import type { EarnedSkillRepository } from '../../../town/EarnedSkillRepository'
import { earnTownSkill } from '../../../town/earnTownSkill'
import { saveChangedTown } from '../../../town/saveChangedTown'
import { settleTownTo } from '../../../town/settleTownTo'
import type { Town } from '../../../town/Town'
import type { TownCatalog } from '../../../town/TownCatalog'
import type { TownNews } from '../../../town/TownNews'
import type { TownRepository } from '../../../town/TownRepository'
import type { TownSkill } from '../../../town/TownSkill'
import type { LessonCatalog } from '../../curriculum/ports/LessonCatalog'
import type { HeldCard } from '../../HeldCard'
import { heldCardsOf } from '../../HeldCards'
import type { Lesson, WordId } from '../../Lesson'
import type { CardRepository } from '../../ports/CardRepository'
import { isLessonRetained } from '../../retention/isLessonRetained'
import { type AnsweredReview, ratedReviewOf } from '../AnsweredReview'
import type { AnswerReviewCommand } from '../AnswerReviewCommand'
import { admitDueReview, type DueReview } from '../admitDueReview'
import { answerGradeOf } from '../answerGradeOf'
import { freshPendingReview } from '../freshPendingReview'
import type { PendingReview } from '../PendingReview'
import type { PendingReviewRepository } from '../ports/PendingReviewRepository'
import type { ReviewLog } from '../ports/ReviewLog'
import type { ReviewLogEntry } from '../ReviewLogEntry'
import { ratingOf } from '../ratingOf'
import { reviewLogEntryOf } from '../reviewLogEntryOf'

export type AnswerReviewDependencies = ReleaseContent & {
  readonly cards: CardRepository
  readonly bandStarts: Pick<BandStartRepository, 'bandStartsOf'>
  readonly pendingReviews: PendingReviewRepository
  readonly reviewLog: ReviewLog
  readonly lessons: LessonCatalog
  readonly clock: Clock
  readonly terms: MemoryTerms
  readonly skills: EarnedSkillRepository
  readonly towns: TownRepository
  readonly news: TownNews
  readonly catalog: TownCatalog
}

const rebaseTownAtEarn = async (
  town: Town,
  skill: TownSkill,
  { towns, news, catalog }: AnswerReviewDependencies,
): Promise<Result<void, DomainError>> => {
  const settled = settleTownTo(town, catalog, skill.earnedAt)
  if (!settled.ok) {
    return settled
  }
  const earned = earnTownSkill(settled.value.town, skill, catalog)
  if (!earned.ok) {
    return earned
  }
  const events = [...settled.value.events, ...earned.value.events]
  return saveChangedTown({ town: earned.value.town, events }, towns, news)
}

const earnSkill = async (
  playerId: PlayerId,
  lesson: Lesson,
  earnedAt: Instant,
  dependencies: AnswerReviewDependencies,
): Promise<Result<TownSkill | undefined, DomainError>> => {
  const { skills, towns } = dependencies
  const earned = await skills.skillsOf(playerId)
  if (!earned.ok) {
    return earned
  }
  if (earned.value.some(({ lessonId }) => lessonId === lesson.id)) {
    return ok(undefined)
  }
  const town = await towns.townOf(playerId)
  if (!town.ok) {
    return town
  }
  const skill: TownSkill = { lessonId: lesson.id, ...lesson.skill, earnedAt }
  const saved = await skills.save(playerId, skill)
  if (!saved.ok) {
    return saved
  }
  if (town.value === undefined) {
    return ok(skill)
  }
  const rebased = await rebaseTownAtEarn(town.value, skill, dependencies)
  return rebased.ok ? ok(skill) : rebased
}

const cardsAfterAnswer = (
  held: ReadonlyArray<HeldCard>,
  wordId: WordId,
  card: MemoryCard,
): ReadonlyArray<HeldCard> =>
  held.map((heldCard) => (heldCard.wordId === wordId ? { wordId, card } : heldCard))

const skillEarnedBy = async (
  playerId: PlayerId,
  review: DueReview,
  before: ReadonlyArray<HeldCard>,
  after: ReadonlyArray<HeldCard>,
  earnedAt: Instant,
  dependencies: AnswerReviewDependencies,
): Promise<Result<TownSkill | undefined, DomainError>> => {
  const { lesson } = review
  const starts = await dependencies.bandStarts.bandStartsOf(playerId)
  if (!starts.ok) {
    return starts
  }
  const released = releasedLessonsOf(starts.value, before, dependencies).flatMap(({ words }) =>
    words.map(({ id }) => id),
  )
  const afterReview = after.filter(({ wordId }) => !released.includes(wordId))
  if (released.includes(review.word.id) || !isLessonRetained(lesson, afterReview)) {
    return ok(undefined)
  }
  return earnSkill(playerId, lesson, earnedAt, dependencies)
}

const markNearMiss = async (
  { playerId, wordId, answer }: AnswerReviewCommand,
  pending: PendingReview | undefined,
  pendingReviews: PendingReviewRepository,
): Promise<Result<AnsweredReview, DomainError>> => {
  const marked = await pendingReviews.save(playerId, wordId, {
    ...(pending ?? freshPendingReview),
    nearMissAnswer: answer,
  })
  return marked.ok ? ok({ kind: 'nearMiss' }) : marked
}

const recordRating = async (
  command: AnswerReviewCommand,
  entry: ReviewLogEntry,
  card: MemoryCard,
  pending: PendingReview | undefined,
  { cards, pendingReviews, reviewLog }: AnswerReviewDependencies,
): Promise<Result<void, DomainError>> => {
  const saved = await cards.save(command.playerId, { wordId: command.wordId, card })
  if (!saved.ok) {
    return saved
  }
  if (pending !== undefined) {
    const cleared = await pendingReviews.delete(command.playerId, command.wordId)
    if (!cleared.ok) {
      return cleared
    }
  }
  return reviewLog.append(entry)
}

export const answerReview = async (
  command: AnswerReviewCommand,
  dependencies: AnswerReviewDependencies,
): Promise<Result<AnsweredReview, DomainError>> => {
  const { cards, pendingReviews, lessons, clock, terms } = dependencies
  const { playerId, wordId, answer } = command
  const now = clock.now()
  const held = await cards.cardsOf(playerId)
  if (!held.ok) {
    return held
  }
  const review = admitDueReview(wordId, lessons.lessonOfWord(wordId), held.value, now, terms)
  if (!review.ok) {
    return review
  }
  const pending = await pendingReviews.pendingReviewOf(playerId, wordId)
  const grade = answerGradeOf(review.value, answer, pending, heldCardsOf(held.value), lessons)
  if (!grade.ok) {
    return grade
  }
  if (grade.value === 'nearMiss') {
    return markNearMiss(command, pending, pendingReviews)
  }
  const rating = ratingOf(grade.value, pending)
  const next = reviewMemoryCard(review.value.held.card, rating, now, terms)
  if (!next.ok) {
    return next
  }
  const entry = reviewLogEntryOf(command, review.value, pending, rating, next.value, now)
  const recorded = await recordRating(command, entry, next.value, pending, dependencies)
  if (!recorded.ok) {
    return recorded
  }
  const after = cardsAfterAnswer(held.value, wordId, next.value)
  const earnedSkill = await skillEarnedBy(
    playerId,
    review.value,
    held.value,
    after,
    now,
    dependencies,
  )
  if (!earnedSkill.ok) {
    return earnedSkill
  }
  return ok(
    ratedReviewOf(rating, next.value, earnedSkill.value, held.value, after, dependencies.catalog),
  )
}
