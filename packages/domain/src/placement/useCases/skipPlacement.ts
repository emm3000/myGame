import type { DomainError } from '#DomainError'
import type { Clock } from '#platform/domain/Clock'
import type { PlayerId } from '#player/PlayerId'
import { ok, type Result } from '#Result'
import {
  admitPlacementOffer,
  type PlacementOfferDependencies,
} from '../application/admitPlacementOffer'
import type { SkippedPlacement } from '../domain/Placement'
import type { PlacementRepository } from '../domain/PlacementRepository'

export type SkipPlacementCommand = {
  readonly playerId: PlayerId
}

export type SkipPlacementDependencies = PlacementOfferDependencies & {
  readonly placements: PlacementRepository
  readonly clock: Clock
}

export const skipPlacement = async (
  { playerId }: SkipPlacementCommand,
  dependencies: SkipPlacementDependencies,
): Promise<Result<SkippedPlacement, DomainError>> => {
  const admitted = await admitPlacementOffer(playerId, dependencies)
  if (!admitted.ok) {
    return admitted
  }
  const placement: SkippedPlacement = { kind: 'skipped', skippedAt: dependencies.clock.now() }
  const saved = await dependencies.placements.save(playerId, placement)
  if (!saved.ok) {
    return saved
  }
  return ok(placement)
}
