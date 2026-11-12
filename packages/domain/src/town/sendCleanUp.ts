import type { DomainError } from '../DomainError'
import type { Clock } from '../ports/Clock'
import { ok, type Result } from '../Result'
import type { CleanUpOrder } from './CleanUpOrder'
import type { CleanUpRepository } from './CleanUpRepository'
import { coversWaste } from './coversWaste'
import { dispatchedCleanUpOf } from './dispatchedCleanUpOf'
import type { CleanUpJob } from './Job'
import { jobInstantsOf } from './jobInstantsOf'
import type { RegionMapReader } from './RegionMapReader'
import { saveChangedTown } from './saveChangedTown'
import type { Town } from './Town'
import type { TownCatalog } from './TownCatalog'
import type { TownNews } from './TownNews'
import type { TownRepository } from './TownRepository'

export type SendCleanUpDependencies = {
  readonly towns: TownRepository
  readonly map: RegionMapReader
  readonly cleanUps: CleanUpRepository
  readonly news: TownNews
  readonly catalog: TownCatalog
  readonly clock: Clock
}

const recordCleaning = (
  town: Town,
  job: CleanUpJob,
  cleanUps: CleanUpRepository,
): Promise<Result<void, DomainError>> | Result<void, DomainError> =>
  coversWaste(job.cleanUp)
    ? cleanUps.record({
        townId: town.id,
        sentAt: job.sentAt,
        site: job.site,
        cleanedAt: jobInstantsOf(job).arrivesAt,
      })
    : ok(undefined)

export const sendCleanUp = async (
  order: CleanUpOrder,
  { towns, map, cleanUps, news, catalog, clock }: SendCleanUpDependencies,
): Promise<Result<Town, DomainError>> => {
  const dispatched = await dispatchedCleanUpOf(
    order,
    { towns, map, cleanUps, catalog },
    clock.now(),
  )
  if (!dispatched.ok) {
    return dispatched
  }
  const { town, events, job } = dispatched.value
  const saved = await saveChangedTown({ town, events }, towns, news)
  if (!saved.ok) {
    return saved
  }
  const recorded = await recordCleaning(town, job, cleanUps)
  return recorded.ok ? ok(town) : recorded
}
