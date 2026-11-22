import type { Placement, PlacementScore } from './Placement'

export const placementScoresOf = (
  placement: Placement | undefined,
): ReadonlyArray<PlacementScore> => (placement?.kind === 'taken' ? placement.scores : [])
