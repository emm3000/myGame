import { allOk, type DomainError, type PlacementScore, type Result } from '@mygame/domain'
import { asc, type Column, eq, type SQL } from 'drizzle-orm'
import { z } from 'zod'
import { placementScoreFromRow } from '#placement/infrastructure/postgres/placementScoreFromRow'
import { placementScores } from '#placement/infrastructure/postgres/placementTables'
import { jsonAggregateOf } from '#platform/infrastructure/postgres/jsonAggregateOf'

const AggregatedPlacementScoresSchema = z.array(
  z.strictObject({ band: z.number().int(), score: z.number().int(), takenAt: z.string() }),
)

export const aggregatedPlacementScoresOf = (playerId: Column): SQL<unknown> =>
  jsonAggregateOf(
    placementScores,
    {
      band: placementScores.band,
      score: placementScores.score,
      takenAt: placementScores.takenAt,
    },
    eq(placementScores.playerId, playerId),
    asc(placementScores.band),
  )

export const placementScoresFrom = (
  aggregate: unknown,
): Result<ReadonlyArray<PlacementScore>, DomainError> =>
  allOk(
    AggregatedPlacementScoresSchema.parse(aggregate).map(({ band, score, takenAt }) =>
      placementScoreFromRow({ band, score, takenAt: new Date(takenAt) }),
    ),
  )
