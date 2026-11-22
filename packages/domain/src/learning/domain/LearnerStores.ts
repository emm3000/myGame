import type { Accounts } from '#account/domain/Accounts'
import type { PlacementRepository } from '#placement/domain/PlacementRepository'
import type { CardRepository } from './CardRepository'

export type LearnerStores = {
  readonly accounts: Accounts
  readonly cards: CardRepository
  readonly placements: PlacementRepository
}
