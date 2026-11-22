import type { DomainError } from '#DomainError'
import type { Clock } from '#platform/domain/Clock'
import { ok, type Result } from '#Result'
import { saveChangedTown } from '../../application/saveChangedTown'
import type { Town } from '../../domain/Town'
import type { TownCatalog } from '../../domain/TownCatalog'
import type { TownNews } from '../../domain/TownNews'
import type { TownRepository } from '../../domain/TownRepository'
import { dispatchCleanUp } from '../application/dispatchCleanUp'
import type { CleanUpOrder } from '../domain/CleanUpOrder'
import type { CleanUpRepository } from '../domain/CleanUpRepository'
import { coversWaste } from '../domain/coversWaste'
import type { CleanUpJob } from '../domain/Job'
import { jobInstantsOf } from '../domain/jobInstantsOf'
import type { RegionMapReader } from '../domain/RegionMapReader'

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
  const dispatched = await dispatchCleanUp(order, { towns, map, cleanUps, catalog }, clock.now())
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
