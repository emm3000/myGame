import type { DomainError } from '#DomainError'
import type { Scaffold } from '#learning/scaffold/Scaffold'
import type { PlayerId } from '#player/PlayerId'
import { ok, type Result } from '#Result'
import type { PlacementOfferDependencies } from '../application/admitPlacementOffer'
import { isPlacementOffered } from '../domain/isPlacementOffered'
import type { PlacementView } from '../domain/PlacementView'
import { placementViewOf } from '../domain/placementViewOf'

export type ReadPlacementViewQuery = {
  readonly playerId: PlayerId
  readonly scaffold: Scaffold
}

export const readPlacementView = async (
  { playerId, scaffold }: ReadPlacementViewQuery,
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
