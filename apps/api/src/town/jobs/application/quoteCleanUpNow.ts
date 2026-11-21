import {
  type CleanUpOrder,
  type CleanUpQuote,
  type CleanUpReader,
  type Clock,
  type DomainError,
  laterOf,
  quoteCleanUp,
  type RegionMapReader,
  type Result,
  type TownCatalog,
} from '@mygame/domain'
import type { ReadOnlyTowns } from '../../application/ports/ReadOnlyTowns'

export type QuoteCleanUpNowDependencies = {
  readonly towns: ReadOnlyTowns
  readonly regionMap: RegionMapReader
  readonly cleanUps: CleanUpReader
  readonly townCatalog: TownCatalog
  readonly clock: Clock
}

export const quoteCleanUpNow = async (
  order: CleanUpOrder,
  { towns, regionMap, cleanUps, townCatalog, clock }: QuoteCleanUpNowDependencies,
): Promise<Result<CleanUpQuote, DomainError>> => {
  const stored = await towns.townOf(order.playerId)
  if (!stored.ok) {
    return stored
  }
  const now = clock.now()
  const readAt = stored.value === undefined ? now : laterOf(now, stored.value.storedAt)
  return quoteCleanUp(order, {
    towns: { townOf: async () => stored },
    map: regionMap,
    cleanUps,
    catalog: townCatalog,
    clock: { now: () => readAt },
  })
}
