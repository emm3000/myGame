import type { PlayerId, RegionMapReader, SiteAddress, SiteHolder, Town } from '@mygame/domain'

export class MemoryRegionMap implements RegionMapReader {
  constructor(private readonly towns: ReadonlyArray<Town>) {}

  async addressOf(playerId: PlayerId): Promise<SiteAddress | undefined> {
    const held = this.towns.find((town) => town.playerId === playerId)
    if (held === undefined) {
      return undefined
    }
    const { region, area, site } = held.address
    return { region, area, site }
  }

  async lastAreaHoldingTown(region: number): Promise<number> {
    return this.towns
      .filter((town) => town.address.region === region)
      .reduce((last, town) => Math.max(last, town.address.area), 0)
  }

  async townsIn(region: number, area: number): Promise<ReadonlyArray<SiteHolder>> {
    return this.towns
      .filter((town) => town.address.region === region && town.address.area === area)
      .map((town) => ({ site: town.address.site, name: town.name.value, playerId: town.playerId }))
      .sort((left, right) => left.site - right.site)
  }
}
