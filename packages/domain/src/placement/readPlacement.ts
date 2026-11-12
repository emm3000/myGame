import type { DomainError } from '../DomainError'
import type { PlayerId } from '../player/PlayerId'
import { ok, type Result } from '../Result'
import { isPlacementOffered, type PlacementOfferDependencies } from './admitPlacementOffer'
import type { PlacementView } from './PlacementView'
import { placementViewOf } from './placementViewOf'

export type ReadPlacementQuery = {
  readonly playerId: PlayerId
}

export const readPlacement = async (
  { playerId }: ReadPlacementQuery,
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
    return ok(placementViewOf(stored.value, starts.value, dependencies.words))
  }
  const isOffered = isPlacementOffered(starts.value, dependencies)
  return ok(isOffered ? { kind: 'offered' } : { kind: 'closed', scores: [] })
}
