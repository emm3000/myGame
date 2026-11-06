import type { Headword } from '@mygame/domain'
import { type Column, eq, type SQL, sql } from 'drizzle-orm'
import { z } from 'zod'
import { jsonAggregateOf } from './jsonAggregateOf'
import { heldOutWords } from './schema'

const AggregatedHeldOutWordsSchema = z.array(z.strictObject({ headword: z.string() }))

export const aggregatedHeldOutWordsOf = (playerId: Column): SQL<unknown> =>
  jsonAggregateOf(
    heldOutWords,
    { headword: heldOutWords.headword },
    eq(heldOutWords.playerId, playerId),
    sql`${heldOutWords.headword} COLLATE "C"`,
  )

export const heldOutHeadwordsOf = (aggregate: unknown): ReadonlyArray<Headword> =>
  AggregatedHeldOutWordsSchema.parse(aggregate).map(({ headword }) => headword)
