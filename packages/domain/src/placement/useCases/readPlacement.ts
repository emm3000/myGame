import type { DomainError } from '../../DomainError'
import type { Scaffold } from '../../learning/scaffold/Scaffold'
import type { PlayerId } from '../../player/PlayerId'
import { ok, type Result } from '../../Result'
import type { PlacementView } from '../PlacementView'
import { placementViewOf } from '../placementViewOf'
import {
  isPlacementOffered,
  type PlacementOfferDependencies,
} from '../services/admitPlacementOffer'

export type ReadPlacementQuery = {
  readonly playerId: PlayerId
  readonly scaffold: Scaffold
}

export const readPlacement = async (
  { playerId, scaffold }: ReadPlacementQuery,
  dependencies: PlacementOfferDependencies,
): Promise<Result<PlacementView, DomainError>> => {
  const stored = await dependencies.placements.placementOf(playerId)
  if (!stored.ok) {
    return stored
  }
  const starts = await dependencies.bandStarts.bandStartsOf(playerId)
  if (!starts.ok) {
    return starts
  }
  if (stored.value !== undefined) {
    return ok(placementViewOf(stored.value, starts.value, dependencies.words, scaffold))
  }
  const isOffered = isPlacementOffered(starts.value, dependencies)
  return ok(isOffered ? { kind: 'offered' } : { kind: 'closed', scores: [] })
}
