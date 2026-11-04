import type { MemoryRating } from '../memory/MemoryRating'
import type { PendingReview } from './PendingReview'

export type AnswerGrade = 'correct' | 'wrong'

export const ratingOf = (grade: AnswerGrade, pending: PendingReview | undefined): MemoryRating => {
  if (grade === 'wrong') {
    return 'again'
  }
  const wasHelped = pending !== undefined && (pending.hintShown || pending.nearMissAnswer !== null)
  return wasHelped ? 'hard' : 'good'
}
