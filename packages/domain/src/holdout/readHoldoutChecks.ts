import type { DomainError } from '../DomainError'
import type { PlayerId } from '../player/PlayerId'
import type { BandStartRepository } from '../ports/BandStartRepository'
import type { Clock } from '../ports/Clock'
import type { PlacementWordCatalog } from '../ports/PlacementWordCatalog'
import { ok, type Result } from '../Result'
import type { HoldoutCheckView } from './HoldoutCheckView'
import { holdoutCheckViewsOf } from './holdoutCheckViewsOf'

export type ReadHoldoutChecksQuery = {
  readonly playerId: PlayerId
}

export type ReadHoldoutChecksDependencies = {
  readonly bandStarts: Pick<BandStartRepository, 'bandStartsOf'>
  readonly words: PlacementWordCatalog
  readonly clock: Clock
}

export const readHoldoutChecks = async (
  { playerId }: ReadHoldoutChecksQuery,
  { bandStarts, words, clock }: ReadHoldoutChecksDependencies,
): Promise<Result<ReadonlyArray<HoldoutCheckView>, DomainError>> => {
  const starts = await bandStarts.bandStartsOf(playerId)
  if (!starts.ok) {
    return starts
  }
  return ok(holdoutCheckViewsOf(starts.value, words, clock.now()))
}
