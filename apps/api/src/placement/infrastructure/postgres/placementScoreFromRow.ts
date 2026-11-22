import {
  bandOf,
  type DomainError,
  Instant,
  ok,
  type PlacementScore,
  type Result,
} from '@mygame/domain'

export type StoredPlacementScore = {
  readonly band: number
  readonly score: number
  readonly takenAt: Date
}

export const placementScoreFromRow = ({
  band,
  score,
  takenAt,
}: StoredPlacementScore): Result<PlacementScore, DomainError> => {
  const known = bandOf(band)
  if (!known.ok) {
    return known
  }
  return ok({ band: known.value, score, takenAt: Instant.fromEpochMilliseconds(takenAt.getTime()) })
}
