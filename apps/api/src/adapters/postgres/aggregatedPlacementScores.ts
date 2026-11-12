import { Instant, type PlacementScore } from '@mygame/domain'
import { asc, type Column, eq, type SQL } from 'drizzle-orm'
import { z } from 'zod'
import { jsonAggregateOf } from './jsonAggregateOf'
import { placementScores } from './schema'

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

export const placementScoresFrom = (aggregate: unknown): ReadonlyArray<PlacementScore> =>
  AggregatedPlacementScoresSchema.parse(aggregate).map(({ band, score, takenAt }) => ({
    band,
    score,
    takenAt: Instant.fromEpochMilliseconds(Date.parse(takenAt)),
  }))
