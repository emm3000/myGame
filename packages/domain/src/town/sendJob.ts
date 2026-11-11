import type { DomainError } from '../DomainError'
import type { PlayerId } from '../player/PlayerId'
import type { Clock } from '../ports/Clock'
import { err, ok, type Result } from '../Result'
import type { Instant } from '../time/Instant'
import type { Hires } from './Hires'
import { isWholeFromOneTo } from './isWholeFromOneTo'
import type { Job } from './Job'
import { jobOneWaySeconds } from './jobOneWaySeconds'
import { jobPayOf } from './jobPayOf'
import { jobSeasonAt } from './jobSeasonAt'
import { lastAreaOf } from './lastAreaOf'
import type { RegionMapReader } from './RegionMapReader'
import { refuseInvalidTeam } from './refuseInvalidTeam'
import { resolvedTownOf } from './resolvedTownOf'
import type { SiteAddress } from './SiteAddress'
import { saveChangedTown } from './saveChangedTown'
import type { Town } from './Town'
import type { TownCatalog } from './TownCatalog'
import type { TownNews } from './TownNews'
import type { TownRepository } from './TownRepository'
import { terrainOf } from './terrainOf'

export type JobTarget = {
  readonly area: number
  readonly site: number
}

export type SendJobCommand = {
  readonly playerId: PlayerId
  readonly site: JobTarget
  readonly team: Hires
  readonly hours: number
}

export type SendJobDependencies = {
  readonly towns: TownRepository
  readonly map: RegionMapReader
  readonly news: TownNews
  readonly catalog: TownCatalog
  readonly clock: Clock
}

const admitJobTerms = (
  town: Town,
  { team, hours }: SendJobCommand,
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
  { team, hours }: SendJobCommand,
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

export const sendJob = async (
  command: SendJobCommand,
  { towns, map, news, catalog, clock }: SendJobDependencies,
): Promise<Result<Town, DomainError>> => {
  const now = clock.now()
  const resolved = await resolvedTownOf(command.playerId, towns, catalog, now)
  if (!resolved.ok) {
    return resolved
  }
  const town = resolved.value.town
  const admitted = admitJobTerms(town, command, catalog)
  if (!admitted.ok) {
    return admitted
  }
  const site = await admitSite(town, command.site, map, catalog)
  if (!site.ok) {
    return site
  }
  const sent = town.sendJob(jobTo(town, site.value, command, catalog, now))
  if (!sent.ok) {
    return sent
  }
  const saved = await saveChangedTown(
    { town: sent.value, events: resolved.value.events },
    towns,
    news,
  )
  if (!saved.ok) {
    return saved
  }
  return ok(sent.value)
}
