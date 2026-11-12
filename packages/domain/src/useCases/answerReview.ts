import type { DomainError } from '../DomainError'
import { type ReleaseContent, releasedLessonsOf } from '../holdout/releasedLessonsOf'
import { admitDueReview, type DueReview } from '../learning/admitDueReview'
import { freshPendingReview } from '../learning/freshPendingReview'
import { gradeTypedAnswer } from '../learning/gradeTypedAnswer'
import type { HeldCard } from '../learning/HeldCard'
import { isLessonRetained } from '../learning/isLessonRetained'
import type { Lesson, WordId } from '../learning/Lesson'
import type { PendingReview } from '../learning/PendingReview'
import { reviewFormatOf } from '../learning/ReviewFormat'
import type { ReviewLogEntry } from '../learning/ReviewLogEntry'
import { type AnswerGrade, ratingOf } from '../learning/ratingOf'
import { recognitionChoicesOf } from '../learning/recognitionChoicesOf'
import type { MemoryCard } from '../memory/MemoryCard'
import type { MemoryRating } from '../memory/MemoryRating'
import type { MemoryTerms } from '../memory/MemoryTerms'
import { reviewMemoryCard } from '../memory/reviewMemoryCard'
import { wholeDaysBetween } from '../memory/wholeDaysBetween'
import type { PlayerId } from '../player/PlayerId'
import type { BandStartRepository } from '../ports/BandStartRepository'
import type { CardRepository } from '../ports/CardRepository'
import type { Clock } from '../ports/Clock'
import type { LessonCatalog } from '../ports/LessonCatalog'
import type { PendingReviewRepository } from '../ports/PendingReviewRepository'
import type { ReviewLog } from '../ports/ReviewLog'
import { err, ok, type Result } from '../Result'
import type { Instant } from '../time/Instant'
import type { EarnedSkillRepository } from '../town/EarnedSkillRepository'
import { earnTownSkill } from '../town/earnTownSkill'
import { saveChangedTown } from '../town/saveChangedTown'
import { settleTownTo } from '../town/settleTownTo'
import type { Town } from '../town/Town'
import type { TownCatalog } from '../town/TownCatalog'
import type { TownNews } from '../town/TownNews'
import type { TownRepository } from '../town/TownRepository'
import type { TownSkill } from '../town/TownSkill'

export type AnswerReviewCommand = {
  readonly playerId: PlayerId
  readonly wordId: WordId
  readonly answer: string
}

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

export type AnsweredReview =
  | { readonly kind: 'nearMiss' }
  | {
      readonly kind: 'rated'
      readonly rating: MemoryRating
      readonly card: MemoryCard
      readonly earnedSkill: TownSkill | undefined
    }

type Grade = AnswerGrade | 'nearMiss'

const gradeOf = (
  review: DueReview,
  answer: string,
  pending: PendingReview | undefined,
  held: ReadonlyArray<HeldCard>,
  lessons: LessonCatalog,
): Result<Grade, DomainError> => {
  if (reviewFormatOf(review.held.card) === 'recognition') {
    const chosen = recognitionChoicesOf(review.word.id, review.lesson, review.held.card, held).find(
      ({ choiceId }) => choiceId === answer,
    )
    if (chosen === undefined) {
      return err({ kind: 'UnknownChoice', wordId: review.word.id })
    }
    return ok(chosen.wordId === review.word.id ? 'correct' : 'wrong')
  }
  const grade = gradeTypedAnswer(answer, review.word.acceptedForms, (word) =>
    lessons.isHeadword(word),
  )
  if (grade === 'nearMiss' && pending !== undefined && pending.nearMissAnswer !== null) {
    return ok('wrong')
  }
  return ok(grade)
}

const logEntryOf = (
  command: AnswerReviewCommand,
  review: DueReview,
  pending: PendingReview | undefined,
  rating: MemoryRating,
  after: MemoryCard,
  now: Instant,
): ReviewLogEntry => {
  const before = review.held.card.stored
  const { nearMissAnswer, hintShown, shownFrame } = pending ?? freshPendingReview
  return {
    playerId: command.playerId,
    wordId: command.wordId,
    reviewedAt: now,
    format: reviewFormatOf(review.held.card),
    answer: command.answer,
    nearMissAnswer,
    hintShown,
    rating,
    elapsedDays: before.lastReviewAt === null ? null : wholeDaysBetween(before.lastReviewAt, now),
    shownFrame,
    before,
    after: after.stored,
  }
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

const skillEarnedBy = async (
  playerId: PlayerId,
  review: DueReview,
  card: MemoryCard,
  cards: ReadonlyArray<HeldCard>,
  earnedAt: Instant,
  dependencies: AnswerReviewDependencies,
): Promise<Result<TownSkill | undefined, DomainError>> => {
  const { lesson } = review
  const starts = await dependencies.bandStarts.bandStartsOf(playerId)
  if (!starts.ok) {
    return starts
  }
  const released = releasedLessonsOf(starts.value, cards, dependencies).flatMap(({ words }) =>
    words.map(({ id }) => id),
  )
  const afterReview = cards
    .filter(({ wordId }) => !released.includes(wordId))
    .map((held) => (held.wordId === review.word.id ? { wordId: held.wordId, card } : held))
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
  const grade = gradeOf(review.value, answer, pending, held.value, lessons)
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
  const entry = logEntryOf(command, review.value, pending, rating, next.value, now)
  const recorded = await recordRating(command, entry, next.value, pending, dependencies)
  if (!recorded.ok) {
    return recorded
  }
  const earnedSkill = await skillEarnedBy(
    playerId,
    review.value,
    next.value,
    held.value,
    now,
    dependencies,
  )
  if (!earnedSkill.ok) {
    return earnedSkill
  }
  return ok({ kind: 'rated', rating, card: next.value, earnedSkill: earnedSkill.value })
}
