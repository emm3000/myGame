import type { DomainError } from '../DomainError'
import type { Clock } from '../ports/Clock'
import { err, ok, type Result } from '../Result'
import type { Instant } from '../time/Instant'
import { admitJobSite } from './admitJobSite'
import type { CleanUpOrder } from './CleanUpOrder'
import type { CleanUpRepository } from './CleanUpRepository'
import { cleanUpJobOf } from './cleanUpJobOf'
import { coversWaste } from './coversWaste'
import type { CleanUpJob } from './Job'
import { jobInstantsOf } from './jobInstantsOf'
import type { RegionMapReader } from './RegionMapReader'
import { refuseInvalidTeam } from './refuseInvalidTeam'
import { resolvedTownOf } from './resolvedTownOf'
import { saveChangedTown } from './saveChangedTown'
import type { Town } from './Town'
import type { TownCatalog } from './TownCatalog'
import type { TownNews } from './TownNews'
import type { TownRepository } from './TownRepository'
import { wasteAt } from './wasteAt'
import { wasteSizeOf } from './wasteSizeOf'

export type SendCleanUpDependencies = {
  readonly towns: TownRepository
  readonly map: RegionMapReader
  readonly cleanUps: CleanUpRepository
  readonly news: TownNews
  readonly catalog: TownCatalog
  readonly clock: Clock
}

type CleanUpAdmission = Pick<SendCleanUpDependencies, 'map' | 'cleanUps' | 'catalog'>

const admittedCleanUpOf = async (
  town: Town,
  { site, team }: CleanUpOrder,
  { map, cleanUps, catalog }: CleanUpAdmission,
  now: Instant,
): Promise<Result<CleanUpJob, DomainError>> => {
  const invalidTeam = refuseInvalidTeam(team)
  if (invalidTeam !== undefined) {
    return err(invalidTeam)
  }
  const room = town.roomForJob()
  if (!room.ok) {
    return room
  }
  const target = await admitJobSite(town, site, map, catalog)
  if (!target.ok) {
    return target
  }
  const { waste: terms } = catalog.townSettings()
  const size = wasteSizeOf(target.value, terms)
  if (size === undefined) {
    return err({ kind: 'NotAWasteSite', area: site.area, site: site.site })
  }
  const lastCleanedAt = await cleanUps.lastCleanedAt(target.value, now)
  const waste = wasteAt(terms.sizes[size], lastCleanedAt, now)
  if (waste === 0) {
    return err({ kind: 'NoWasteYet', area: site.area, site: site.site })
  }
  return ok(cleanUpJobOf(town, target.value, team, { size, waste }, catalog, now))
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
  dependencies: SendCleanUpDependencies,
): Promise<Result<Town, DomainError>> => {
  const { towns, news, cleanUps, catalog, clock } = dependencies
  const now = clock.now()
  const resolved = await resolvedTownOf(order.playerId, towns, catalog, now)
  if (!resolved.ok) {
    return resolved
  }
  const { town, events } = resolved.value
  const job = await admittedCleanUpOf(town, order, dependencies, now)
  if (!job.ok) {
    return job
  }
  const sent = town.sendJob(job.value)
  if (!sent.ok) {
    return sent
  }
  const saved = await saveChangedTown({ town: sent.value, events }, towns, news)
  if (!saved.ok) {
    return saved
  }
  const recorded = await recordCleaning(sent.value, job.value, cleanUps)
  return recorded.ok ? ok(sent.value) : recorded
}
