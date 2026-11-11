import type { DomainError } from '../DomainError'
import type { Clock } from '../ports/Clock'
import { ok, type Result } from '../Result'
import { dispatchedJobOf } from './dispatchedJobOf'
import type { JobOrder } from './JobOrder'
import type { RegionMapReader } from './RegionMapReader'
import type { Stocks } from './Stocks'
import type { TownCatalog } from './TownCatalog'
import type { TownRepository } from './TownRepository'

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
  const dispatched = await dispatchedJobOf(order, { towns, map, catalog }, clock.now())
  return dispatched.ok ? ok(dispatched.value.job.pay) : dispatched
}
