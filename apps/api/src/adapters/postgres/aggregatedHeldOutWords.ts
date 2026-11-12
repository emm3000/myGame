import { type Headword, RELEASING_WEEK } from '@mygame/domain'
import { type Column, eq, type SQL, sql } from 'drizzle-orm'
import { z } from 'zod'
import { jsonAggregateOf } from './jsonAggregateOf'
import { heldOutWords, holdoutChecks } from './schema'

const AggregatedHeldOutWordsSchema = z.array(z.strictObject({ headword: z.string() }))

const isReleased = sql`EXISTS (SELECT 1 FROM ${holdoutChecks} WHERE ${holdoutChecks.playerId} = ${heldOutWords.playerId} AND ${holdoutChecks.band} = ${heldOutWords.band} AND ${holdoutChecks.week} = ${RELEASING_WEEK} AND ${holdoutChecks.closedAt} IS NOT NULL)`

export const aggregatedHeldOutWordsOf = (playerId: Column): SQL<unknown> =>
  jsonAggregateOf(
    heldOutWords,
    { headword: heldOutWords.headword },
    sql`${eq(heldOutWords.playerId, playerId)} AND NOT ${isReleased}`,
    sql`${heldOutWords.headword} COLLATE "C"`,
  )

export const heldOutHeadwordsOf = (aggregate: unknown): ReadonlyArray<Headword> =>
  AggregatedHeldOutWordsSchema.parse(aggregate).map(({ headword }) => headword)
