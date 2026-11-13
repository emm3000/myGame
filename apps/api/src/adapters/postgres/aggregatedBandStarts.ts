import { type BandStart, Instant } from '@mygame/domain'
import { asc, type Column, eq, type SQL, sql } from 'drizzle-orm'
import { z } from 'zod'
import { jsonAggregateOf } from './jsonAggregateOf'
import {
  bandStarts,
  heldOutWords,
  holdoutCheckKind,
  holdoutChecks,
  holdoutCheckWords,
} from './schema'
import { holdoutCheckOf } from './storedHoldoutChecks'

const TimestampSchema = z.string().transform((iso) => new Date(iso))

const AggregatedBandStartsSchema = z.array(
  z.strictObject({
    band: z.number().int(),
    startedAt: TimestampSchema,
    heldOutWords: z.array(z.strictObject({ headword: z.string() })),
    checks: z.array(
      z.strictObject({
        week: z.number().int(),
        kind: z.enum(holdoutCheckKind.enumValues),
        begunAt: TimestampSchema.nullable(),
        closedAt: TimestampSchema.nullable(),
        heldOutScore: z.number().int().nullable(),
        practisedScore: z.number().int().nullable(),
        words: z.array(z.strictObject({ wordId: z.string(), isHeldOut: z.boolean() })),
      }),
    ),
  }),
)

const aggregatedCheckWords = jsonAggregateOf(
  holdoutCheckWords,
  { wordId: holdoutCheckWords.wordId, isHeldOut: holdoutCheckWords.isHeldOut },
  sql`${eq(holdoutCheckWords.playerId, holdoutChecks.playerId)} AND ${eq(holdoutCheckWords.band, holdoutChecks.band)} AND ${eq(holdoutCheckWords.week, holdoutChecks.week)}`,
  asc(holdoutCheckWords.position),
)

const aggregatedChecks = jsonAggregateOf(
  holdoutChecks,
  {
    week: holdoutChecks.week,
    kind: holdoutChecks.kind,
    begunAt: holdoutChecks.begunAt,
    closedAt: holdoutChecks.closedAt,
    heldOutScore: holdoutChecks.heldOutScore,
    practisedScore: holdoutChecks.practisedScore,
    words: aggregatedCheckWords,
  },
  sql`${eq(holdoutChecks.playerId, bandStarts.playerId)} AND ${eq(holdoutChecks.band, bandStarts.band)}`,
  asc(holdoutChecks.week),
)

const aggregatedHeadwords = jsonAggregateOf(
  heldOutWords,
  { headword: heldOutWords.headword },
  sql`${eq(heldOutWords.playerId, bandStarts.playerId)} AND ${eq(heldOutWords.band, bandStarts.band)}`,
  sql`${heldOutWords.headword} COLLATE "C"`,
)

export const aggregatedBandStartsOf = (playerId: Column): SQL<unknown> =>
  jsonAggregateOf(
    bandStarts,
    {
      band: bandStarts.band,
      startedAt: bandStarts.startedAt,
      heldOutWords: aggregatedHeadwords,
      checks: aggregatedChecks,
    },
    eq(bandStarts.playerId, playerId),
    asc(bandStarts.band),
  )

export const bandStartsFrom = (aggregate: unknown): ReadonlyArray<BandStart> =>
  AggregatedBandStartsSchema.parse(aggregate).map(({ band, startedAt, heldOutWords, checks }) => ({
    band,
    startedAt: Instant.fromEpochMilliseconds(startedAt.getTime()),
    heldOutWords: heldOutWords.map(({ headword }) => headword),
    checks: checks.map(({ words, ...check }) => holdoutCheckOf(check, words)),
  }))
