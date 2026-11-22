import type { DomainError } from '#DomainError'
import type { Clock } from '#platform/domain/Clock'
import { ok, type Result } from '#Result'
import type { ReadOnlyTowns } from '../../domain/ReadOnlyTowns'
import { readInstantOf } from '../../domain/readInstantOf'
import type { TownCatalog } from '../../domain/TownCatalog'
import type { Stocks } from '../../resources/domain/Stocks'
import type { JobOrder } from '../domain/JobOrder'
import type { RegionMapReader } from '../domain/RegionMapReader'
import { dispatchJob } from './dispatchJob'

export type QuoteJobDependencies = {
  readonly towns: ReadOnlyTowns
  readonly regionMap: RegionMapReader
  readonly townCatalog: TownCatalog
  readonly clock: Clock
}

export class QuoteJob {
  constructor(private readonly dependencies: QuoteJobDependencies) {}

  async execute(order: JobOrder): Promise<Result<Stocks, DomainError>> {
    const { towns, regionMap, townCatalog, clock } = this.dependencies
    const stored = await towns.townOf(order.playerId)
    if (!stored.ok) {
      return stored
    }
    const now = clock.now()
    const readAt = readInstantOf(now, stored.value?.storedAt)
    const dispatched = await dispatchJob(
      order,
      { towns: { townOf: async () => stored }, map: regionMap, catalog: townCatalog },
      readAt,
    )
    return dispatched.ok ? ok(dispatched.value.job.pay) : dispatched
  }
}
