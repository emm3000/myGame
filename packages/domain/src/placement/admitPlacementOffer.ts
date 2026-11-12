import type { DomainError } from '../DomainError'
import type { BandStart } from '../learning/BandStart'
import type { PlayerId } from '../player/PlayerId'
import type { BandStartRepository } from '../ports/BandStartRepository'
import type { PlacementRepository } from '../ports/PlacementRepository'
import type { PlacementWordCatalog } from '../ports/PlacementWordCatalog'
import { err, ok, type Result } from '../Result'
import { isPlacementDrawable } from './placementSamplesDrawn'

export type PlacementOfferDependencies = {
  readonly placements: Pick<PlacementRepository, 'placementOf'>
  readonly bandStarts: Pick<BandStartRepository, 'bandStartsOf'>
  readonly words: PlacementWordCatalog
}

export const isPlacementOffered = (
  starts: ReadonlyArray<BandStart>,
  words: PlacementWordCatalog,
): boolean => starts.length === 0 && isPlacementDrawable(words)

export const admitPlacementOffer = async (
  playerId: PlayerId,
  { placements, bandStarts, words }: PlacementOfferDependencies,
): Promise<Result<void, DomainError>> => {
  const stored = await placements.placementOf(playerId)
  if (!stored.ok) {
    return stored
  }
  if (stored.value !== undefined) {
    return err({ kind: 'PlacementAlreadyTaken' })
  }
  const starts = await bandStarts.bandStartsOf(playerId)
  if (!starts.ok) {
    return starts
  }
  if (!isPlacementOffered(starts.value, words)) {
    return err({ kind: 'PlacementNotOffered' })
  }
  return ok(undefined)
}
