import type { Placement } from '../placement/Placement'
import type { PlayerId } from '../player/PlayerId'
import type { PlacementRepository } from '../ports/PlacementRepository'
import { ok } from '../Result'

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
