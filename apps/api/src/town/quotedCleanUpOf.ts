import {
  type CleanUpOrder,
  type CleanUpQuote,
  type CleanUpReader,
  type Clock,
  type DomainError,
  quoteCleanUp,
  type RegionMapReader,
  type Result,
  type TownCatalog,
} from '@mygame/domain'
import { laterOf } from '../time/laterOf'
import type { TownReader } from './TownReader'

export type QuotedCleanUpDependencies = {
  readonly towns: TownReader
  readonly regionMap: RegionMapReader
  readonly cleanUps: CleanUpReader
  readonly townCatalog: TownCatalog
  readonly clock: Clock
}

export const quotedCleanUpOf = async (
  order: CleanUpOrder,
  { towns, regionMap, cleanUps, townCatalog, clock }: QuotedCleanUpDependencies,
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
