import type { DomainError } from '#DomainError'
import type { Clock } from '#platform/domain/Clock'
import { ok, type Result } from '#Result'
import type { TownCatalog } from '../../ports/TownCatalog'
import type { TownRepository } from '../../ports/TownRepository'
import type { Stocks } from '../../resources/Stocks'
import type { JobOrder } from '../JobOrder'
import type { RegionMapReader } from '../ports/RegionMapReader'
import { dispatchJob } from '../services/dispatchJob'

export type QuoteJobDependencies = {
  readonly towns: Pick<TownRepository, 'townOf'>
  readonly map: RegionMapReader
  readonly catalog: TownCatalog
  readonly clock: Clock
}

export const quoteJob = async (
  order: JobOrder,
  { towns, map, catalog, clock }: QuoteJobDependencies,
): Promise<Result<Stocks, DomainError>> => {
  const dispatched = await dispatchJob(order, { towns, map, catalog }, clock.now())
  return dispatched.ok ? ok(dispatched.value.job.pay) : dispatched
}
