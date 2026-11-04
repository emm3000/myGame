import type { StoredMemoryCard } from '../memory/MemoryCard'
import type { MemoryRating } from '../memory/MemoryRating'
import type { PlayerId } from '../player/PlayerId'
import type { Instant } from '../time/Instant'
import type { WordId } from './Lesson'
import type { ReviewFormat } from './ReviewFormat'

export type ReviewLogEntry = {
  readonly playerId: PlayerId
  readonly wordId: WordId
  readonly reviewedAt: Instant
  readonly format: ReviewFormat
  readonly answer: string
  readonly nearMissAnswer: string | null
  readonly hintShown: boolean
  readonly rating: MemoryRating
  readonly elapsedDays: number | null
  readonly before: StoredMemoryCard
  readonly after: StoredMemoryCard
}
