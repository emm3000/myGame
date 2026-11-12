import {
  type Band,
  type DomainError,
  type HeldCard,
  ok,
  type PlayerId,
  placedOutBandsOf,
  placementScoresOf,
  type Result,
} from '@mygame/domain'
import type { TownStores } from '../town/mutateTown'

export type Learner = {
  readonly cards: ReadonlyArray<HeldCard>
  readonly placedOutBands: ReadonlyArray<Band>
}

export const learnerOf = async (
  playerId: PlayerId,
  { cards, placements }: Pick<TownStores, 'cards' | 'placements'>,
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
  })
}
