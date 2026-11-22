import type { DomainError } from '#DomainError'
import type { Scaffold } from '#learning/scaffold/Scaffold'
import type { PlacementWordCatalog } from '#placement/domain/PlacementWordCatalog'
import type { Clock } from '#platform/domain/Clock'
import type { PlayerId } from '#player/PlayerId'
import { ok, type Result } from '#Result'
import type { BandStartRepository } from '../domain/BandStartRepository'
import type { HoldoutCheckView } from '../domain/HoldoutCheckView'
import { holdoutCheckViewsOf } from '../domain/holdoutCheckViewsOf'

export type ReadHoldoutCheckViewsQuery = {
  readonly playerId: PlayerId
  readonly scaffold: Scaffold
}

export type ReadHoldoutCheckViewsDependencies = {
  readonly bandStarts: Pick<BandStartRepository, 'bandStartsOf'>
  readonly words: PlacementWordCatalog
  readonly clock: Clock
}

export const readHoldoutCheckViews = async (
  { playerId, scaffold }: ReadHoldoutCheckViewsQuery,
  { bandStarts, words, clock }: ReadHoldoutCheckViewsDependencies,
): Promise<Result<ReadonlyArray<HoldoutCheckView>, DomainError>> => {
  const starts = await bandStarts.bandStartsOf(playerId)
  if (!starts.ok) {
    return starts
  }
  return ok(holdoutCheckViewsOf(starts.value, words, clock.now(), scaffold))
}
