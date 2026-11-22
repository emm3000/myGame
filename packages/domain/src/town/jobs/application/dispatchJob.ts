import type { DomainError } from '#DomainError'
import { err, ok, type Result } from '#Result'
import type { Instant } from '#time/Instant'
import { resolveStoredTown } from '../../application/resolveStoredTown'
import type { SiteAddress } from '../../domain/SiteAddress'
import type { ChangedTown, Town } from '../../domain/Town'
import type { TownCatalog } from '../../domain/TownCatalog'
import type { TownRepository } from '../../domain/TownRepository'
import { terrainOf } from '../../domain/terrainOf'
import { isWholeFromOneTo } from '../domain/isWholeFromOneTo'
import type { Job } from '../domain/Job'
import type { JobOrder } from '../domain/JobOrder'
import { jobOneWaySeconds } from '../domain/jobOneWaySeconds'
import { jobPayOf } from '../domain/jobPayOf'
import { jobSeasonAt } from '../domain/jobSeasonAt'
import type { RegionMapReader } from '../domain/RegionMapReader'
import { refuseInvalidTeam } from '../domain/refuseInvalidTeam'
import { admitJobSite } from './admitJobSite'

export type JobDispatchDependencies = {
  readonly towns: Pick<TownRepository, 'townOf'>
  readonly map: RegionMapReader
  readonly catalog: TownCatalog
}

export type DispatchedJob = ChangedTown & {
  readonly job: Job
}

const admitJobTerms = (
  town: Town,
  { team, hours }: JobOrder,
  catalog: TownCatalog,
): Result<void, DomainError> => {
  const invalidTeam = refuseInvalidTeam(team)
  if (invalidTeam !== undefined) {
    return err(invalidTeam)
  }
  const { maxHours } = catalog.townSettings().job
  if (!isWholeFromOneTo(hours, maxHours)) {
    return err({ kind: 'JobHoursOutOfRange', hours, maxHours })
  }
  return town.jobs.room()
}

const jobTo = (
  town: Town,
  site: SiteAddress,
  { team, hours }: JobOrder,
  catalog: TownCatalog,
  now: Instant,
): Job => {
  const { roadPercent, payPercent } = jobSeasonAt(now, catalog.townSettings())
  return {
    kind: 'out',
    site,
    team,
    hours,
    sentAt: now,
    oneWaySeconds: jobOneWaySeconds(town.address, site, team, catalog, roadPercent),
    pay: jobPayOf(terrainOf(site.area), team, hours, catalog, payPercent),
    payPercent,
  }
}

export const dispatchJob = async (
  order: JobOrder,
  { towns, map, catalog }: JobDispatchDependencies,
  now: Instant,
): Promise<Result<DispatchedJob, DomainError>> => {
  const resolved = await resolveStoredTown(order.playerId, towns, catalog, now)
  if (!resolved.ok) {
    return resolved
  }
  const { town, events } = resolved.value
  const admitted = admitJobTerms(town, order, catalog)
  if (!admitted.ok) {
    return admitted
  }
  const site = await admitJobSite(town, order.site, map, catalog)
  if (!site.ok) {
    return site
  }
  const job = jobTo(town, site.value, order, catalog, now)
  const sent = town.jobs.send(job)
  if (!sent.ok) {
    return sent
  }
  return ok({ town: town.changedBy(sent.value), events, job })
}
