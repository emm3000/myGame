import type { MemoryCard } from '../memory/MemoryCard'
import type { WordId } from './Lesson'

export type HeldCard = {
  readonly wordId: WordId
  readonly card: MemoryCard
}
