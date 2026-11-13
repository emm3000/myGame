import {
  type Band,
  type DomainError,
  type HeldCard,
  ok,
  type PlayerId,
  placedOutBandsOf,
  placementScoresOf,
  type Result,
  type Scaffold,
} from '@mygame/domain'
import type { TownStores } from '../town/mutateTown'
import { scaffoldOf } from './scaffoldOf'

export type Learner = {
  readonly cards: ReadonlyArray<HeldCard>
  readonly placedOutBands: ReadonlyArray<Band>
  readonly scaffold: Scaffold
}

export const learnerOf = async (
  playerId: PlayerId,
  { accounts, cards, placements }: Pick<TownStores, 'accounts' | 'cards' | 'placements'>,
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
    scaffold: await scaffoldOf(playerId, accounts),
  })
}
