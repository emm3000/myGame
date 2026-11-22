import type { MemoryCard } from '#memory/domain/MemoryCard'

export type ReviewFormat = 'recognition' | 'recall'

export const reviewFormatOf = (card: MemoryCard): ReviewFormat =>
  card.stored.state === 'learning' ? 'recognition' : 'recall'
