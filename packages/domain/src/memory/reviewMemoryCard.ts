import type { DomainError } from '../DomainError'
import { err, type Result } from '../Result'
import type { Instant } from '../time/Instant'
import { MemoryCard, type MemoryPlacement, type StoredMemoryCard } from './MemoryCard'
import type { MemoryRating } from './MemoryRating'
import type { MemoryTerms } from './MemoryTerms'
import { nextMemoryOf } from './nextMemoryOf'
import { wholeDaysBetween } from './wholeDaysBetween'

const RETAINED_AFTER_DAYS = 7

const reviewPlacement: MemoryPlacement = { state: 'review', step: null }

const placementAlongSteps = (
  state: 'learning' | 'relearning',
  step: number,
  rating: MemoryRating,
  stepsSeconds: ReadonlyArray<number>,
): MemoryPlacement => {
  const isPastSteps =
    stepsSeconds.length === 0 || (step >= stepsSeconds.length && rating !== 'again')
  if (isPastSteps) {
    return reviewPlacement
  }
  switch (rating) {
    case 'again':
      return { state, step: 0 }
    case 'hard':
      return { state, step }
    case 'good':
      return step + 1 === stepsSeconds.length ? reviewPlacement : { state, step: step + 1 }
    case 'easy':
      return reviewPlacement
    default: {
      const unknownRating: never = rating
      return unknownRating
    }
  }
}

const nextPlacementOf = (
  stored: StoredMemoryCard,
  rating: MemoryRating,
  terms: MemoryTerms,
): MemoryPlacement => {
  switch (stored.state) {
    case 'learning':
      return placementAlongSteps('learning', stored.step, rating, terms.learningStepsSeconds)
    case 'relearning':
      return placementAlongSteps('relearning', stored.step, rating, terms.relearningStepsSeconds)
    case 'review':
      return rating === 'again' && terms.relearningStepsSeconds.length > 0
        ? { state: 'relearning', step: 0 }
        : reviewPlacement
    default: {
      const unknownState: never = stored
      return unknownState
    }
  }
}

const retainedAtOf = (
  stored: StoredMemoryCard,
  rating: MemoryRating,
  at: Instant,
): Instant | null => {
  if (stored.state === 'learning' || rating !== 'good') {
    return null
  }
  return wholeDaysBetween(stored.lastReviewAt, at) >= RETAINED_AFTER_DAYS ? at : null
}

export const reviewMemoryCard = (
  card: MemoryCard,
  rating: MemoryRating,
  at: Instant,
  terms: MemoryTerms,
): Result<MemoryCard, DomainError> => {
  const stored = card.stored
  if (
    stored.lastReviewAt !== null &&
    at.epochMilliseconds < stored.lastReviewAt.epochMilliseconds
  ) {
    return err({
      kind: 'ReviewBeforeLastReview',
      lastReviewAt: stored.lastReviewAt,
      reviewedAt: at,
    })
  }
  return MemoryCard.restore({
    ...nextPlacementOf(stored, rating, terms),
    ...nextMemoryOf(card, rating, at, terms),
    lastReviewAt: at,
    lastRating: rating,
    enteredAt: stored.enteredAt,
    retainedAt: retainedAtOf(stored, rating, at),
  })
}
