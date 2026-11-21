import type { MemoryCard } from '#memory/MemoryCard'
import type { MemoryRating } from '#memory/MemoryRating'
import { openedLevelOf } from '#town/building/openedLevelOf'
import type { TownCatalog } from '#town/ports/TownCatalog'
import type { TownSkill } from '#town/TownSkill'
import type { HeldCard } from '../HeldCard'
import { retainedWordCountOf } from '../retention/retainedWordCountOf'
import { stableWordCountOf } from '../retention/stableWordCountOf'

export type AnsweredReview =
  | { readonly kind: 'nearMiss' }
  | {
      readonly kind: 'rated'
      readonly rating: MemoryRating
      readonly card: MemoryCard
      readonly earnedSkill: TownSkill | undefined
      readonly stableWordCount: number
      readonly retainedWordCount: number
      readonly openedLevel: number | null
    }

export const ratedReviewOf = (
  rating: MemoryRating,
  card: MemoryCard,
  earnedSkill: TownSkill | undefined,
  before: ReadonlyArray<HeldCard>,
  after: ReadonlyArray<HeldCard>,
  catalog: TownCatalog,
): AnsweredReview => ({
  kind: 'rated',
  rating,
  card,
  earnedSkill,
  stableWordCount: stableWordCountOf(after),
  retainedWordCount: retainedWordCountOf(after),
  openedLevel: openedLevelOf(before, after, catalog),
})
