import type { DomainError } from '../DomainError'
import type { PlayerId } from '../player/PlayerId'
import { err, ok, type Result } from '../Result'
import { isWholeFromOneTo } from './isWholeFromOneTo'
import { lastAreaOf } from './lastAreaOf'
import type { RegionMap, RegionSite } from './RegionMap'
import type { RegionMapReader, SiteHolder } from './RegionMapReader'
import type { TownCatalog } from './TownCatalog'
import { terrainOf } from './terrainOf'

export type ReadRegionMapCommand = {
  readonly playerId: PlayerId
  readonly area?: number
}

export type ReadRegionMapDependencies = {
  readonly map: RegionMapReader
  readonly catalog: TownCatalog
}

const regionSiteOf = (
  site: number,
  holders: ReadonlyArray<SiteHolder>,
  viewer: PlayerId,
): RegionSite => {
  const holder = holders.find((held) => held.site === site)
  return {
    site,
    town:
      holder === undefined ? undefined : { name: holder.name, isOwn: holder.playerId === viewer },
  }
}

export const readRegionMap = async (
  { playerId, area }: ReadRegionMapCommand,
  { map, catalog }: ReadRegionMapDependencies,
): Promise<Result<RegionMap, DomainError>> => {
  const address = await map.addressOf(playerId)
  if (address === undefined) {
    return err({ kind: 'TownNotFound', playerId })
  }
  const { region } = address
  const shown = area ?? address.area
  const lastArea = await lastAreaOf(region, map)
  if (!isWholeFromOneTo(shown, lastArea)) {
    return err({ kind: 'AreaNotFound', area: shown })
  }
  const holders = await map.townsIn(region, shown)
  return ok({
    region,
    area: shown,
    lastArea,
    terrain: terrainOf(shown),
    sites: Array.from({ length: catalog.townSettings().sitesPerArea }, (_, index) =>
      regionSiteOf(index + 1, holders, playerId),
    ),
  })
}
