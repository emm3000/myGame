import type { DomainError } from '../DomainError'
import { err, ok, type Result } from '../Result'
import type { Instant } from '../time/Instant'
import { admitJobSite } from './admitJobSite'
import type { CleanUpOrder } from './CleanUpOrder'
import type { CleanUpReader } from './CleanUpReader'
import { cleanUpJobOf } from './cleanUpJobOf'
import type { CleanUpJob } from './Job'
import type { RegionMapReader } from './RegionMapReader'
import { refuseInvalidTeam } from './refuseInvalidTeam'
import { resolvedTownOf } from './resolvedTownOf'
import type { ChangedTown, Town } from './Town'
import type { TownCatalog } from './TownCatalog'
import type { TownRepository } from './TownRepository'
import { wasteAt } from './wasteAt'
import { wasteSizeOf } from './wasteSizeOf'

export type CleanUpDispatchDependencies = {
  readonly towns: Pick<TownRepository, 'townOf'>
  readonly map: RegionMapReader
  readonly cleanUps: Pick<CleanUpReader, 'lastCleanedAt'>
  readonly catalog: TownCatalog
}

export type DispatchedCleanUp = ChangedTown & {
  readonly job: CleanUpJob
}

const admittedCleanUpOf = async (
  town: Town,
  { site, team }: CleanUpOrder,
  { map, cleanUps, catalog }: CleanUpDispatchDependencies,
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

export const dispatchedCleanUpOf = async (
  order: CleanUpOrder,
  dependencies: CleanUpDispatchDependencies,
  now: Instant,
): Promise<Result<DispatchedCleanUp, DomainError>> => {
  const resolved = await resolvedTownOf(
    order.playerId,
    dependencies.towns,
    dependencies.catalog,
    now,
  )
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
  return ok({ town: sent.value, events, job: job.value })
}
