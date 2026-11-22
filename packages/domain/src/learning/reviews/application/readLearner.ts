import { readScaffold } from '#account/application/readScaffold'
import type { DomainError } from '#DomainError'
import { placedOutBandsOf } from '#placement/domain/placedOutBandsOf'
import { placementScoresOf } from '#placement/domain/placementScoresOf'
import type { PlayerId } from '#player/PlayerId'
import { ok, type Result } from '#Result'
import type { Band } from '../../curriculum/domain/Band'
import type { HeldCard } from '../../domain/HeldCard'
import type { LearnerStores } from '../../domain/LearnerStores'
import type { Scaffold } from '../../scaffold/domain/Scaffold'

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
  const scaffold = await readScaffold(playerId, accounts)
  if (!scaffold.ok) {
    return scaffold
  }
  return ok({
    cards: held.value,
    placedOutBands: placedOutBandsOf(placementScoresOf(placement.value)),
    scaffold: scaffold.value,
  })
}
