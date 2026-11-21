import type { DomainError } from '#DomainError'
import type { BandStartRepository } from '#holdout/ports/BandStartRepository'
import type { PlayerId } from '#player/PlayerId'
import { err, ok, type Result } from '#Result'
import { isPlacementOffered } from '../isPlacementOffered'
import type { PlacementContent } from '../placementSamplesDrawn'
import type { PlacementRepository } from '../ports/PlacementRepository'

export type PlacementOfferDependencies = PlacementContent & {
  readonly placements: Pick<PlacementRepository, 'placementOf'>
  readonly bandStarts: Pick<BandStartRepository, 'bandStartsOf'>
}

export const admitPlacementOffer = async (
  playerId: PlayerId,
  dependencies: PlacementOfferDependencies,
): Promise<Result<void, DomainError>> => {
  const stored = await dependencies.placements.placementOf(playerId)
  if (!stored.ok) {
    return stored
  }
  if (stored.value !== undefined) {
    return err({ kind: 'PlacementAlreadyTaken' })
  }
  const starts = await dependencies.bandStarts.bandStartsOf(playerId)
  if (!starts.ok) {
    return starts
  }
  if (!isPlacementOffered(starts.value, dependencies)) {
    return err({ kind: 'PlacementNotOffered' })
  }
  return ok(undefined)
}
