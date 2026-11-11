import type { RegionMapReader } from './RegionMapReader'

export const lastAreaOf = async (region: number, map: RegionMapReader): Promise<number> =>
  (await map.lastAreaHoldingTown(region)) + 1
