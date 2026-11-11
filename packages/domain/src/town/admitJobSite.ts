import type { DomainError } from '../DomainError'
import { err, ok, type Result } from '../Result'
import { isWholeFromOneTo } from './isWholeFromOneTo'
import type { JobTarget } from './JobOrder'
import { lastAreaOf } from './lastAreaOf'
import type { RegionMapReader } from './RegionMapReader'
import type { SiteAddress } from './SiteAddress'
import type { Town } from './Town'
import type { TownCatalog } from './TownCatalog'

export const admitJobSite = async (
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
