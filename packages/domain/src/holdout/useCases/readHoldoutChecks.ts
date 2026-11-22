import type { DomainError } from '#DomainError'
import type { Scaffold } from '#learning/scaffold/Scaffold'
import type { PlacementWordCatalog } from '#placement/domain/PlacementWordCatalog'
import type { Clock } from '#platform/domain/Clock'
import type { PlayerId } from '#player/PlayerId'
import { ok, type Result } from '#Result'
import type { HoldoutCheckView } from '../HoldoutCheckView'
import { holdoutCheckViewsOf } from '../holdoutCheckViewsOf'
import type { BandStartRepository } from '../ports/BandStartRepository'

export type ReadHoldoutChecksQuery = {
  readonly playerId: PlayerId
  readonly scaffold: Scaffold
}

export type ReadHoldoutChecksDependencies = {
  readonly bandStarts: Pick<BandStartRepository, 'bandStartsOf'>
  readonly words: PlacementWordCatalog
  readonly clock: Clock
}

export const readHoldoutChecks = async (
  { playerId, scaffold }: ReadHoldoutChecksQuery,
  { bandStarts, words, clock }: ReadHoldoutChecksDependencies,
): Promise<Result<ReadonlyArray<HoldoutCheckView>, DomainError>> => {
  const starts = await bandStarts.bandStartsOf(playerId)
  if (!starts.ok) {
    return starts
  }
  return ok(holdoutCheckViewsOf(starts.value, words, clock.now(), scaffold))
}
