import type { Instant } from '../time/Instant'
import { difficultyBounds } from './difficultyBounds'
import type { MemoryCard, RecalledMemory } from './MemoryCard'
import type { MemoryRating } from './MemoryRating'
import type { FsrsParameters, MemoryTerms } from './MemoryTerms'
import { retrievabilityOf } from './retrievabilityOf'
import { wholeDaysBetween } from './wholeDaysBetween'

export type NextMemory = Pick<RecalledMemory, 'stability' | 'difficulty'>

const STABILITY_MIN = 0.001

const gradeOf: Readonly<Record<MemoryRating, number>> = { again: 1, hard: 2, good: 3, easy: 4 }

const clampedStability = (stability: number): number => Math.max(stability, STABILITY_MIN)

const clampedDifficulty = (difficulty: number): number =>
  Math.min(Math.max(difficulty, difficultyBounds.min), difficultyBounds.max)

const unclampedInitialDifficulty = (parameters: FsrsParameters, grade: number): number =>
  parameters[4] - Math.E ** (parameters[5] * (grade - 1)) + 1

const initialStabilityOf = (
  parameters: FsrsParameters,
): Readonly<Record<MemoryRating, number>> => ({
  again: parameters[0],
  hard: parameters[1],
  good: parameters[2],
  easy: parameters[3],
})

const initialMemory = (parameters: FsrsParameters, rating: MemoryRating): NextMemory => ({
  stability: clampedStability(initialStabilityOf(parameters)[rating]),
  difficulty: clampedDifficulty(unclampedInitialDifficulty(parameters, gradeOf[rating])),
})

const nextDifficulty = (parameters: FsrsParameters, difficulty: number, grade: number): number => {
  const deltaDifficulty = -(parameters[6] * (grade - 3))
  const dampedDifficulty = difficulty + ((10 - difficulty) * deltaDifficulty) / 9
  const easyDifficulty = unclampedInitialDifficulty(parameters, gradeOf.easy)
  return clampedDifficulty(parameters[7] * easyDifficulty + (1 - parameters[7]) * dampedDifficulty)
}

const shortTermStability = (
  parameters: FsrsParameters,
  stability: number,
  grade: number,
): number => {
  const increase =
    Math.E ** (parameters[17] * (grade - 3 + parameters[18])) * stability ** -parameters[19]
  const boundedIncrease = grade === gradeOf.again ? increase : Math.max(increase, 1)
  return clampedStability(stability * boundedIncrease)
}

const forgetStability = (
  parameters: FsrsParameters,
  memory: NextMemory,
  retrievability: number,
): number => {
  const longTerm =
    parameters[11] *
    memory.difficulty ** -parameters[12] *
    ((memory.stability + 1) ** parameters[13] - 1) *
    Math.E ** ((1 - retrievability) * parameters[14])
  const shortTerm = memory.stability / Math.E ** (parameters[17] * parameters[18])
  return Math.min(longTerm, shortTerm)
}

const recallStability = (
  parameters: FsrsParameters,
  memory: NextMemory,
  retrievability: number,
  grade: number,
): number => {
  const hardPenalty = grade === gradeOf.hard ? parameters[15] : 1
  const easyBonus = grade === gradeOf.easy ? parameters[16] : 1
  return (
    memory.stability *
    (1 +
      Math.E ** parameters[8] *
        (11 - memory.difficulty) *
        memory.stability ** -parameters[9] *
        (Math.E ** ((1 - retrievability) * parameters[10]) - 1) *
        hardPenalty *
        easyBonus)
  )
}

const longTermStability = (
  parameters: FsrsParameters,
  memory: NextMemory,
  retrievability: number,
  grade: number,
): number =>
  clampedStability(
    grade === gradeOf.again
      ? forgetStability(parameters, memory, retrievability)
      : recallStability(parameters, memory, retrievability, grade),
  )

export const nextMemoryOf = (
  card: MemoryCard,
  rating: MemoryRating,
  at: Instant,
  terms: MemoryTerms,
): NextMemory => {
  const parameters = terms.parameters
  const grade = gradeOf[rating]
  const stored = card.stored
  if (stored.lastReviewAt === null) {
    return initialMemory(parameters, rating)
  }
  const isSameDay = wholeDaysBetween(stored.lastReviewAt, at) < 1
  return {
    stability: isSameDay
      ? shortTermStability(parameters, stored.stability, grade)
      : longTermStability(parameters, stored, retrievabilityOf(card, at, terms), grade),
    difficulty: nextDifficulty(parameters, stored.difficulty, grade),
  }
}
