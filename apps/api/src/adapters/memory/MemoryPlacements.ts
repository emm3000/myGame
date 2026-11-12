import {
  type DomainError,
  ok,
  type Placement,
  type PlacementRepository,
  type PlayerId,
  type Result,
} from '@mygame/domain'

const withNewScores = (stored: Placement, saved: Placement): Placement => {
  if (stored.kind === 'skipped' || saved.kind === 'skipped') {
    return stored
  }
  const newScores = saved.scores.filter(
    (score) => !stored.scores.some(({ band }) => band === score.band),
  )
  return { ...stored, scores: [...stored.scores, ...newScores] }
}

export class MemoryPlacements implements PlacementRepository {
  private readonly placements = new Map<PlayerId, Placement>()

  async placementOf(playerId: PlayerId): Promise<Result<Placement | undefined, DomainError>> {
    return ok(this.placements.get(playerId))
  }

  async save(playerId: PlayerId, placement: Placement): Promise<Result<void, DomainError>> {
    const stored = this.placements.get(playerId)
    this.placements.set(
      playerId,
      stored === undefined ? placement : withNewScores(stored, placement),
    )
    return ok(undefined)
  }
}
