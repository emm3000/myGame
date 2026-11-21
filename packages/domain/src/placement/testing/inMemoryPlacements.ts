import type { PlayerId } from '../../player/PlayerId'
import { ok } from '../../Result'
import type { Placement } from '../Placement'
import type { PlacementRepository } from '../ports/PlacementRepository'

export type OwnedPlacement = {
  readonly playerId: PlayerId
  readonly placement: Placement
}

const mergedPlacement = (stored: Placement, saved: Placement): Placement => {
  if (stored.kind === 'skipped' || saved.kind === 'skipped') {
    return stored
  }
  const newScores = saved.scores.filter(
    (score) => !stored.scores.some(({ band }) => band === score.band),
  )
  return { ...stored, scores: [...stored.scores, ...newScores] }
}

export const inMemoryPlacements = (
  existing: ReadonlyArray<OwnedPlacement>,
): PlacementRepository => {
  const placements = new Map(existing.map(({ playerId, placement }) => [playerId, placement]))
  return {
    placementOf: async (playerId) => ok(placements.get(playerId)),
    save: async (playerId, placement) => {
      const stored = placements.get(playerId)
      placements.set(
        playerId,
        stored === undefined ? placement : mergedPlacement(stored, placement),
      )
      return ok(undefined)
    },
  }
}
