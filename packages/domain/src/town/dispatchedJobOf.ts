import type { DomainError } from '../DomainError'
import { err, ok, type Result } from '../Result'
import type { Instant } from '../time/Instant'
import { isWholeFromOneTo } from './isWholeFromOneTo'
import type { Job } from './Job'
import type { JobOrder, JobTarget } from './JobOrder'
import { jobOneWaySeconds } from './jobOneWaySeconds'
import { jobPayOf } from './jobPayOf'
import { jobSeasonAt } from './jobSeasonAt'
import { lastAreaOf } from './lastAreaOf'
import type { RegionMapReader } from './RegionMapReader'
import { refuseInvalidTeam } from './refuseInvalidTeam'
import { resolvedTownOf } from './resolvedTownOf'
import type { SiteAddress } from './SiteAddress'
import type { ChangedTown, Town } from './Town'
import type { TownCatalog } from './TownCatalog'
import type { TownRepository } from './TownRepository'
import { terrainOf } from './terrainOf'

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
  return town.roomForJob()
}

const admitSite = async (
  town: Town,
  { area, site }: JobTarget,
  map: RegionMapReader,
  catalog: TownCatalog,
): Promise<Result<SiteAddress, DomainError>> => {
  const { region } = town.address
  const lastArea = await lastAreaOf(region, map)
  const { sitesPerArea } = catalog.townSettings()
  if (!isWholeFromOneTo(area, lastArea) || !isWholeFromOneTo(site, sitesPerArea)) {
    return err({ kind: 'JobSiteOutOfBounds', area, site })
  }
  const holder = (await map.townsIn(region, area)).find((held) => held.site === site)
  if (holder === undefined) {
    return ok({ region, area, site })
  }
  return err(
    holder.playerId === town.playerId ? { kind: 'JobToOwnSite' } : { kind: 'SiteHeld', area, site },
  )
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

export const dispatchedJobOf = async (
  order: JobOrder,
  { towns, map, catalog }: JobDispatchDependencies,
  now: Instant,
): Promise<Result<DispatchedJob, DomainError>> => {
  const resolved = await resolvedTownOf(order.playerId, towns, catalog, now)
  if (!resolved.ok) {
    return resolved
  }
  const { town, events } = resolved.value
  const admitted = admitJobTerms(town, order, catalog)
  if (!admitted.ok) {
    return admitted
  }
  const site = await admitSite(town, order.site, map, catalog)
  if (!site.ok) {
    return site
  }
  const job = jobTo(town, site.value, order, catalog, now)
  const sent = town.sendJob(job)
  if (!sent.ok) {
    return sent
  }
  return ok({ town: sent.value, events, job })
}
