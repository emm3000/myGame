import type { DomainError } from '#DomainError'
import { err, ok, type Result } from '#Result'
import type { SiteAddress } from '../../domain/SiteAddress'
import type { Town } from '../../domain/Town'
import type { TownCatalog } from '../../domain/TownCatalog'
import { isWholeFromOneTo } from '../domain/isWholeFromOneTo'
import type { JobTarget } from '../domain/JobOrder'
import type { RegionMapReader } from '../domain/RegionMapReader'
import { readLastArea } from './readLastArea'

export const admitJobSite = async (
  town: Town,
  { area, site }: JobTarget,
  map: RegionMapReader,
  catalog: TownCatalog,
): Promise<Result<SiteAddress, DomainError>> => {
  const { region } = town.address
  const lastArea = await readLastArea(region, map)
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
