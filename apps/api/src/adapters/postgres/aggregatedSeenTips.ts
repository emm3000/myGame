import { type TipKind, tipKinds } from '@mygame/domain'
import { type Column, eq, type SQL, sql } from 'drizzle-orm'
import { z } from 'zod'
import { jsonAggregateOf } from './jsonAggregateOf'
import { playerSeenTips, townTip } from './schema'

type StoredTip = (typeof townTip.enumValues)[number]

export const storedTips: Readonly<Record<TipKind, StoredTip>> = {
  people: 'people',
  seasons: 'seasons',
  waitingList: 'waiting_list',
  office: 'office',
  jobs: 'jobs',
  fullStore: 'full_store',
}

const AggregatedSeenTipsSchema = z.array(z.strictObject({ tip: z.enum(townTip.enumValues) }))

export const aggregatedSeenTipsOf = (playerId: Column): SQL<unknown> =>
  jsonAggregateOf(
    playerSeenTips,
    { tip: playerSeenTips.tip },
    eq(playerSeenTips.playerId, playerId),
    sql`${playerSeenTips.tip}`,
  )

export const seenTipsFrom = (aggregate: unknown): ReadonlyArray<TipKind> => {
  const seen = new Set(AggregatedSeenTipsSchema.parse(aggregate).map(({ tip }) => tip))
  return tipKinds.filter((tip) => seen.has(storedTips[tip]))
}
