import type { RegionMapReader } from '../town/RegionMapReader'
import type { Town } from '../town/Town'

export const inMemoryRegionMap = (towns: ReadonlyArray<Town>): RegionMapReader => ({
  addressOf: async (playerId) => {
    const held = towns.find((town) => town.playerId === playerId)
    return held === undefined
      ? undefined
      : { region: held.address.region, area: held.address.area, site: held.address.site }
  },
  lastAreaHoldingTown: async (region) =>
    towns
      .filter((town) => town.address.region === region)
      .reduce((last, town) => Math.max(last, town.address.area), 0),
  townsIn: async (region, area) =>
    towns
      .filter((town) => town.address.region === region && town.address.area === area)
      .map((town) => ({ site: town.address.site, name: town.name.value, playerId: town.playerId })),
})
