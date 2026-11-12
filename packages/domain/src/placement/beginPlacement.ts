import type { DomainError } from '../DomainError'
import type { PlayerId } from '../player/PlayerId'
import type { Clock } from '../ports/Clock'
import type { PlacementRepository } from '../ports/PlacementRepository'
import type { RandomSource } from '../ports/RandomSource'
import { ok, type Result } from '../Result'
import { admitPlacementOffer, type PlacementOfferDependencies } from './admitPlacementOffer'
import type { TakenPlacement } from './Placement'
import { placementSamplesDrawn } from './placementSamplesDrawn'

export type BeginPlacementCommand = {
  readonly playerId: PlayerId
}

export type BeginPlacementDependencies = PlacementOfferDependencies & {
  readonly placements: PlacementRepository
  readonly random: RandomSource
  readonly clock: Clock
}

export const beginPlacement = async (
  { playerId }: BeginPlacementCommand,
  dependencies: BeginPlacementDependencies,
): Promise<Result<TakenPlacement, DomainError>> => {
  const admitted = await admitPlacementOffer(playerId, dependencies)
  if (!admitted.ok) {
    return admitted
  }
  const placement: TakenPlacement = {
    kind: 'taken',
    begunAt: dependencies.clock.now(),
    samples: placementSamplesDrawn(dependencies, dependencies.random),
    scores: [],
  }
  const saved = await dependencies.placements.save(playerId, placement)
  if (!saved.ok) {
    return saved
  }
  return ok(placement)
}
