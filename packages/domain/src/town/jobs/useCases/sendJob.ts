import type { DomainError } from '#DomainError'
import type { Clock } from '#platform/domain/Clock'
import { ok, type Result } from '#Result'
import { saveChangedTown } from '../../application/saveChangedTown'
import type { Town } from '../../domain/Town'
import type { TownCatalog } from '../../domain/TownCatalog'
import type { TownNews } from '../../domain/TownNews'
import type { TownRepository } from '../../domain/TownRepository'
import type { JobOrder } from '../JobOrder'
import type { RegionMapReader } from '../ports/RegionMapReader'
import { dispatchJob } from '../services/dispatchJob'

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
  const dispatched = await dispatchJob(order, { towns, map, catalog }, clock.now())
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
