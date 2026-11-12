import type { DomainError } from '../DomainError'
import type { PlayerId } from '../player/PlayerId'
import type { Clock } from '../ports/Clock'
import type { PlacementRepository } from '../ports/PlacementRepository'
import { ok, type Result } from '../Result'
import { admitPlacementOffer, type PlacementOfferDependencies } from './admitPlacementOffer'
import type { SkippedPlacement } from './Placement'

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
