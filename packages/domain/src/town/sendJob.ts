import type { DomainError } from '../DomainError'
import type { Clock } from '../ports/Clock'
import { ok, type Result } from '../Result'
import { dispatchedJobOf } from './dispatchedJobOf'
import type { JobOrder } from './JobOrder'
import type { RegionMapReader } from './RegionMapReader'
import { saveChangedTown } from './saveChangedTown'
import type { Town } from './Town'
import type { TownCatalog } from './TownCatalog'
import type { TownNews } from './TownNews'
import type { TownRepository } from './TownRepository'

export type SendJobDependencies = {
  readonly towns: TownRepository
  readonly map: RegionMapReader
  readonly news: TownNews
  readonly catalog: TownCatalog
  readonly clock: Clock
}

export const sendJob = async (
  order: JobOrder,
  { towns, map, news, catalog, clock }: SendJobDependencies,
): Promise<Result<Town, DomainError>> => {
  const dispatched = await dispatchedJobOf(order, { towns, map, catalog }, clock.now())
  if (!dispatched.ok) {
    return dispatched
  }
  const { town, events } = dispatched.value
  const saved = await saveChangedTown({ town, events }, towns, news)
  if (!saved.ok) {
    return saved
  }
  return ok(town)
}
