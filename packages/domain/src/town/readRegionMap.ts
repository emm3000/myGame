import type { DomainError } from '../DomainError'
import type { PlayerId } from '../player/PlayerId'
import type { Clock } from '../ports/Clock'
import { err, ok, type Result } from '../Result'
import type { Instant } from '../time/Instant'
import type { CleanUpReader } from './CleanUpReader'
import { isWholeFromOneTo } from './isWholeFromOneTo'
import { lastAreaOf } from './lastAreaOf'
import type { RegionMap, RegionSite, SiteWaste } from './RegionMap'
import type { RegionMapReader, SiteHolder } from './RegionMapReader'
import type { SiteAddress } from './SiteAddress'
import type { TownCatalog } from './TownCatalog'
import type { WasteTerms } from './TownSettings'
import { terrainOf } from './terrainOf'
import { wasteAt } from './wasteAt'
import { wasteSizeOf } from './wasteSizeOf'

export type ReadRegionMapCommand = {
  readonly playerId: PlayerId
  readonly area?: number
}

export type ReadRegionMapDependencies = {
  readonly map: RegionMapReader
  readonly cleanUps: CleanUpReader
  readonly catalog: TownCatalog
  readonly clock: Clock
}

type SiteReading = {
  readonly holders: ReadonlyArray<SiteHolder>
  readonly lastCleanings: ReadonlyMap<number, Instant>
  readonly viewer: PlayerId
  readonly terms: WasteTerms
  readonly at: Instant
}

const siteWasteOf = (
  address: SiteAddress,
  { lastCleanings, terms, at }: SiteReading,
): SiteWaste | undefined => {
  const size = wasteSizeOf(address, terms)
  return size === undefined
    ? undefined
    : { size, waste: wasteAt(terms.sizes[size], lastCleanings.get(address.site), at) }
}

const regionSiteOf = (address: SiteAddress, reading: SiteReading): RegionSite => {
  const holder = reading.holders.find((held) => held.site === address.site)
  if (holder !== undefined) {
    return {
      site: address.site,
      town: { name: holder.name, isOwn: holder.playerId === reading.viewer },
      waste: undefined,
    }
  }
  return { site: address.site, town: undefined, waste: siteWasteOf(address, reading) }
}

export const readRegionMap = async (
  { playerId, area }: ReadRegionMapCommand,
  { map, cleanUps, catalog, clock }: ReadRegionMapDependencies,
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
  const at = clock.now()
  const { sitesPerArea, waste: terms } = catalog.townSettings()
  const reading: SiteReading = {
    holders: await map.townsIn(region, shown),
    lastCleanings: await cleanUps.lastCleanedAtIn(region, shown, at),
    viewer: playerId,
    terms,
    at,
  }
  const sites = Array.from({ length: sitesPerArea }, (_, index) =>
    regionSiteOf({ region, area: shown, site: index + 1 }, reading),
  )
  return ok({ region, area: shown, lastArea, terrain: terrainOf(shown), sites })
}
