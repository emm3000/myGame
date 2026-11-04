import type { DomainError } from '../DomainError'
import { materializeStocks } from '../fief/materializeStocks'
import { rebaseFullSince } from '../fief/rebaseFullSince'
import { admitDueReview, type DueReview } from '../learning/admitDueReview'
import type { EarnedSkill } from '../learning/EarnedSkill'
import { gradeTypedAnswer } from '../learning/gradeTypedAnswer'
import type { HeldCard } from '../learning/HeldCard'
import { isLessonRetained } from '../learning/isLessonRetained'
import type { WordId } from '../learning/Lesson'
import type { PendingReview } from '../learning/PendingReview'
import { reviewFormatOf } from '../learning/ReviewFormat'
import type { ReviewLogEntry } from '../learning/ReviewLogEntry'
import { type AnswerGrade, ratingOf } from '../learning/ratingOf'
import type { MemoryCard } from '../memory/MemoryCard'
import type { MemoryRating } from '../memory/MemoryRating'
import type { MemoryTerms } from '../memory/MemoryTerms'
import { reviewMemoryCard } from '../memory/reviewMemoryCard'
import { wholeDaysBetween } from '../memory/wholeDaysBetween'
import type { PlayerId } from '../player/PlayerId'
import type { BuildingCatalog } from '../ports/BuildingCatalog'
import type { CardRepository } from '../ports/CardRepository'
import type { Clock } from '../ports/Clock'
import type { FiefRepository } from '../ports/FiefRepository'
import type { LessonCatalog } from '../ports/LessonCatalog'
import type { PendingReviewRepository } from '../ports/PendingReviewRepository'
import type { ReviewLog } from '../ports/ReviewLog'
import { ok, type Result } from '../Result'
import type { Instant } from '../time/Instant'

export type AnswerReviewCommand = {
  readonly playerId: PlayerId
  readonly wordId: WordId
  readonly answer: string
}

export type AnswerReviewDependencies = {
  readonly fiefs: Pick<FiefRepository, 'fiefsOf' | 'fiefOf' | 'save'>
  readonly catalog: BuildingCatalog
  readonly cards: CardRepository
  readonly pendingReviews: PendingReviewRepository
  readonly reviewLog: ReviewLog
  readonly lessons: LessonCatalog
  readonly clock: Clock
  readonly terms: MemoryTerms
}

export type AnsweredReview =
  | { readonly kind: 'nearMiss' }
  | {
      readonly kind: 'rated'
      readonly rating: MemoryRating
      readonly card: MemoryCard
      readonly earnedSkill: EarnedSkill | undefined
    }

type Grade = AnswerGrade | 'nearMiss'

const gradeOf = (
  review: DueReview,
  answer: string,
  pending: PendingReview | undefined,
  lessons: LessonCatalog,
): Grade => {
  if (reviewFormatOf(review.held.card) === 'recognition') {
    return answer === review.word.id ? 'correct' : 'wrong'
  }
  const grade = gradeTypedAnswer(answer, review.word.acceptedForms, (word) =>
    lessons.isHeadword(word),
  )
  if (grade === 'nearMiss' && pending !== undefined && pending.nearMissAnswer !== null) {
    return 'wrong'
  }
  return grade
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
  return {
    playerId: command.playerId,
    wordId: command.wordId,
    reviewedAt: now,
    format: reviewFormatOf(review.held.card),
    answer: command.answer,
    nearMissAnswer: pending?.nearMissAnswer ?? null,
    hintShown: pending?.hintShown ?? false,
    rating,
    elapsedDays: before.lastReviewAt === null ? null : wholeDaysBetween(before.lastReviewAt, now),
    before,
    after: after.stored,
  }
}

const earnSkillOnEveryFief = async (
  playerId: PlayerId,
  skill: EarnedSkill,
  { fiefs, catalog }: Pick<AnswerReviewDependencies, 'fiefs' | 'catalog'>,
): Promise<Result<EarnedSkill | undefined, DomainError>> => {
  const fiefIds = [...(await fiefs.fiefsOf(playerId))].sort()
  let earned: EarnedSkill | undefined
  for (const fiefId of fiefIds) {
    const stored = await fiefs.fiefOf(fiefId)
    if (!stored.ok) {
      return stored
    }
    const fief = stored.value
    if (fief === undefined || fief.skills.some(({ lessonId }) => lessonId === skill.lessonId)) {
      continue
    }
    const stocksAtNow = materializeStocks(fief, catalog, skill.earnedAt)
    if (!stocksAtNow.ok) {
      return stocksAtNow
    }
    const rebased = rebaseFullSince(
      fief,
      fief.earnSkill(skill, stocksAtNow.value, skill.earnedAt),
      catalog,
    )
    if (!rebased.ok) {
      return rebased
    }
    const saved = await fiefs.save(rebased.value)
    if (!saved.ok) {
      return saved
    }
    earned = skill
  }
  return ok(earned)
}

const skillEarnedBy = async (
  playerId: PlayerId,
  review: DueReview,
  card: MemoryCard,
  cards: ReadonlyArray<HeldCard>,
  earnedAt: Instant,
  dependencies: AnswerReviewDependencies,
): Promise<Result<EarnedSkill | undefined, DomainError>> => {
  const { lesson } = review
  const afterReview = cards.map((held) =>
    held.wordId === review.word.id ? { wordId: held.wordId, card } : held,
  )
  if (!isLessonRetained(lesson, afterReview)) {
    return ok(undefined)
  }
  return earnSkillOnEveryFief(
    playerId,
    { lessonId: lesson.id, ...lesson.skill, earnedAt },
    dependencies,
  )
}

const markNearMiss = async (
  { playerId, wordId, answer }: AnswerReviewCommand,
  pending: PendingReview | undefined,
  pendingReviews: PendingReviewRepository,
): Promise<Result<AnsweredReview, DomainError>> => {
  const marked = await pendingReviews.save(playerId, wordId, {
    hintShown: pending?.hintShown ?? false,
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
  const grade = gradeOf(review.value, answer, pending, lessons)
  if (grade === 'nearMiss') {
    return markNearMiss(command, pending, pendingReviews)
  }
  const rating = ratingOf(grade, pending)
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
