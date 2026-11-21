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
  type TownRepository,
} from '@mygame/domain'

export type QuotedJobDependencies = {
  readonly towns: Omit<TownRepository, 'save'>
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
