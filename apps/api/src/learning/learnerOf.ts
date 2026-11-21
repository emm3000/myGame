import {
  type Band,
  type CardRepository,
  type DomainError,
  type HeldCard,
  ok,
  type PlacementRepository,
  type PlayerId,
  placedOutBandsOf,
  placementScoresOf,
  type Result,
  type Scaffold,
} from '@mygame/domain'
import type { Accounts } from '../account/application/ports/Accounts'
import { readScaffold } from '../account/application/readScaffold'

export type LearnerStores = {
  readonly accounts: Accounts
  readonly cards: CardRepository
  readonly placements: PlacementRepository
}

export type Learner = {
  readonly cards: ReadonlyArray<HeldCard>
  readonly placedOutBands: ReadonlyArray<Band>
  readonly scaffold: Scaffold
}

export const learnerOf = async (
  playerId: PlayerId,
  { accounts, cards, placements }: LearnerStores,
): Promise<Result<Learner, DomainError>> => {
  const held = await cards.cardsOf(playerId)
  if (!held.ok) {
    return held
  }
  const placement = await placements.placementOf(playerId)
  if (!placement.ok) {
    return placement
  }
  return ok({
    cards: held.value,
    placedOutBands: placedOutBandsOf(placementScoresOf(placement.value)),
    scaffold: await readScaffold(playerId, accounts),
  })
}
