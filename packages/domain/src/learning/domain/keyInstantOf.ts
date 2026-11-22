import type { MemoryCard } from '#memory/domain/MemoryCard'
import type { Instant } from '#time/Instant'

export const keyInstantOf = ({ stored }: MemoryCard): Instant =>
  stored.lastReviewAt ?? stored.enteredAt
