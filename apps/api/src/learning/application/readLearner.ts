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
import { readScaffold } from '#account/application/readScaffold'
import type { LearnerStores } from './ports/LearnerStores'

export type Learner = {
  readonly cards: ReadonlyArray<HeldCard>
  readonly placedOutBands: ReadonlyArray<Band>
  readonly scaffold: Scaffold
}

export const readLearner = async (
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
