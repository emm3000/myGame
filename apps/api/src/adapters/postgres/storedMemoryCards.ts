import { Instant, type StoredMemoryCard } from '@mygame/domain'
import type { cards } from './schema'

export type CardColumns = Pick<
  typeof cards.$inferSelect,
  | 'state'
  | 'step'
  | 'stability'
  | 'difficulty'
  | 'lastReviewAt'
  | 'lastRating'
  | 'enteredAt'
  | 'retainedAt'
>

const instantOf = (date: Date): Instant => Instant.fromEpochMilliseconds(date.getTime())

const instantOrNullOf = (date: Date | null): Instant | null =>
  date === null ? null : instantOf(date)

const dateOrNullOf = (instant: Instant | null): Date | null =>
  instant === null ? null : new Date(instant.epochMilliseconds)

export const cardColumnsOf = (stored: StoredMemoryCard): CardColumns => ({
  state: stored.state,
  step: stored.step,
  stability: stored.stability,
  difficulty: stored.difficulty,
  lastReviewAt: dateOrNullOf(stored.lastReviewAt),
  lastRating: stored.lastRating,
  enteredAt: new Date(stored.enteredAt.epochMilliseconds),
  retainedAt: dateOrNullOf(stored.retainedAt),
})

export const storedMemoryCardOf = (columns: CardColumns, owner: string): StoredMemoryCard => {
  const { state, step, stability, difficulty, lastReviewAt, lastRating } = columns
  const entered = {
    enteredAt: instantOf(columns.enteredAt),
    retainedAt: instantOrNullOf(columns.retainedAt),
  }
  if (lastReviewAt === null) {
    if (state !== 'learning' || step === null) {
      throw new Error(`${owner} stores an unreviewed card outside its learning steps`)
    }
    return {
      ...entered,
      state,
      step,
      stability: null,
      difficulty: null,
      lastReviewAt: null,
      lastRating: null,
    }
  }
  if (stability === null || difficulty === null || lastRating === null) {
    throw new Error(`${owner} stores a half-written card`)
  }
  const recalled = { stability, difficulty, lastReviewAt: instantOf(lastReviewAt), lastRating }
  if (state === 'review') {
    return { ...entered, ...recalled, state, step: null }
  }
  if (step === null) {
    throw new Error(`${owner} stores a ${state} card without its step`)
  }
  return { ...entered, ...recalled, state, step }
}
