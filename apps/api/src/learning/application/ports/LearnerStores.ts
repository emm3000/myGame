import type { CardRepository, PlacementRepository } from '@mygame/domain'
import type { Accounts } from '#account/application/ports/Accounts'

export type LearnerStores = {
  readonly accounts: Accounts
  readonly cards: CardRepository
  readonly placements: PlacementRepository
}
