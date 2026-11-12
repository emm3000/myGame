import type { DomainError } from '../DomainError'
import type { BandStart } from '../learning/BandStart'
import type { PlayerId } from '../player/PlayerId'
import type { BandStartRepository } from '../ports/BandStartRepository'
import type { PlacementRepository } from '../ports/PlacementRepository'
import { err, ok, type Result } from '../Result'
import { isPlacementDrawable, type PlacementContent } from './placementSamplesDrawn'

export type PlacementOfferDependencies = PlacementContent & {
  readonly placements: Pick<PlacementRepository, 'placementOf'>
  readonly bandStarts: Pick<BandStartRepository, 'bandStartsOf'>
}

export const isPlacementOffered = (
  starts: ReadonlyArray<BandStart>,
  content: PlacementContent,
): boolean => starts.length === 0 && isPlacementDrawable(content)

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
