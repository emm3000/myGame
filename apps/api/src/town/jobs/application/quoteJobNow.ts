import {
  type Clock,
  type DomainError,
  type JobOrder,
  laterOf,
  quoteJob,
  type RegionMapReader,
  type Result,
  type Stocks,
  type TownCatalog,
} from '@mygame/domain'
import type { ReadOnlyTowns } from '../../application/ports/ReadOnlyTowns'

export type QuoteJobNowDependencies = {
  readonly towns: ReadOnlyTowns
  readonly regionMap: RegionMapReader
  readonly townCatalog: TownCatalog
  readonly clock: Clock
}

export const quoteJobNow = async (
  order: JobOrder,
  { towns, regionMap, townCatalog, clock }: QuoteJobNowDependencies,
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
