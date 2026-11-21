import type { RegionMap } from '@mygame/contracts'
import type { RegionMap as DomainRegionMap, RegionSite } from '@mygame/domain'

const regionSiteOf = ({ site, town, waste }: RegionSite): RegionMap['sites'][number] => ({
  site,
  town: town === undefined ? null : { name: town.name, isOwn: town.isOwn },
  waste: waste === undefined ? null : { size: waste.size, waste: waste.waste },
})

export const regionMapOf = (map: DomainRegionMap): RegionMap => ({
  region: map.region,
  area: map.area,
  lastArea: map.lastArea,
  terrain: map.terrain,
  sites: map.sites.map(regionSiteOf),
})
