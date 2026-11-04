import type { MemoryCard } from '../memory/MemoryCard'

export type ReviewFormat = 'recognition' | 'recall'

export const reviewFormatOf = (card: MemoryCard): ReviewFormat =>
  card.stored.state === 'learning' ? 'recognition' : 'recall'
