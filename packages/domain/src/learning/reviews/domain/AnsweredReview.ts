import type { MemoryCard } from '#memory/domain/MemoryCard'
import type { MemoryRating } from '#memory/domain/MemoryRating'
import { openedLevelOf } from '#town/building/domain/openedLevelOf'
import type { TownCatalog } from '#town/domain/TownCatalog'
import type { TownSkill } from '#town/domain/TownSkill'
import type { HeldCard } from '../../domain/HeldCard'
import { retainedWordCountOf } from '../../retention/domain/retainedWordCountOf'
import { stableWordCountOf } from '../../retention/domain/stableWordCountOf'

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
