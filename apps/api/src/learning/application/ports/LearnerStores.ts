import type { Accounts, CardRepository, PlacementRepository } from '@mygame/domain'

export type LearnerStores = {
  readonly accounts: Accounts
  readonly cards: CardRepository
  readonly placements: PlacementRepository
}
