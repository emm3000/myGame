import type { DomainError } from '../DomainError'
import { err, ok, type Result } from '../Result'
import type { Instant } from '../time/Instant'
import { difficultyBounds } from './difficultyBounds'
import type { MemoryRating } from './MemoryRating'

export type RecalledMemory = {
  readonly stability: number
  readonly difficulty: number
  readonly lastReviewAt: Instant
  readonly lastRating: MemoryRating
}

export type UnreviewedMemory = {
  readonly stability: null
  readonly difficulty: null
  readonly lastReviewAt: null
  readonly lastRating: null
}

export type MemoryPlacement =
  | { readonly state: 'learning' | 'relearning'; readonly step: number }
  | { readonly state: 'review'; readonly step: null }

export type StoredMemoryCard = {
  readonly enteredAt: Instant
  readonly retainedAt: Instant | null
} & (
  | ({ readonly state: 'learning'; readonly step: number } & UnreviewedMemory)
  | (MemoryPlacement & RecalledMemory)
)

const isWholeCount = (value: number): boolean => Number.isInteger(value) && value >= 0

const refuseOutsideInvariants = (stored: StoredMemoryCard): DomainError | undefined => {
  if (stored.step !== null && !isWholeCount(stored.step)) {
    return { kind: 'InvalidMemoryCard', field: 'step', value: stored.step }
  }
  if (stored.stability === null) {
    return undefined
  }
  if (!(Number.isFinite(stored.stability) && stored.stability > 0)) {
    return { kind: 'InvalidMemoryCard', field: 'stability', value: stored.stability }
  }
  if (!(stored.difficulty >= difficultyBounds.min && stored.difficulty <= difficultyBounds.max)) {
    return { kind: 'InvalidMemoryCard', field: 'difficulty', value: stored.difficulty }
  }
  return undefined
}

export class MemoryCard {
  private constructor(readonly stored: StoredMemoryCard) {}

  static entered(enteredAt: Instant): MemoryCard {
    return new MemoryCard({
      state: 'learning',
      step: 0,
      stability: null,
      difficulty: null,
      lastReviewAt: null,
      lastRating: null,
      enteredAt,
      retainedAt: null,
    })
  }

  static restore(stored: StoredMemoryCard): Result<MemoryCard, DomainError> {
    const refusal = refuseOutsideInvariants(stored)
    if (refusal !== undefined) {
      return err(refusal)
    }
    return ok(new MemoryCard(stored))
  }
}
