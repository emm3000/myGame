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
  type TownRepository,
} from '@mygame/domain'

export type QuotedCleanUpDependencies = {
  readonly towns: Omit<TownRepository, 'save'>
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
