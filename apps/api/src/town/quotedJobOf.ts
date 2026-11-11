import {
  type Clock,
  type DomainError,
  type JobOrder,
  quoteJob,
  type RegionMapReader,
  type Result,
  type Stocks,
  type TownCatalog,
} from '@mygame/domain'
import { laterOf } from '../time/laterOf'
import type { TownReader } from './TownReader'

export type QuotedJobDependencies = {
  readonly towns: TownReader
  readonly regionMap: RegionMapReader
  readonly townCatalog: TownCatalog
  readonly clock: Clock
}

export const quotedJobOf = async (
  order: JobOrder,
  { towns, regionMap, townCatalog, clock }: QuotedJobDependencies,
): Promise<Result<Stocks, DomainError>> => {
  const stored = await towns.townOf(order.playerId)
  if (!stored.ok) {
    return stored
  }
  const now = clock.now()
  const readAt = stored.value === undefined ? now : laterOf(now, stored.value.storedAt)
  return quoteJob(order, {
    towns: { townOf: async () => stored },
    map: regionMap,
    catalog: townCatalog,
    clock: { now: () => readAt },
  })
}
