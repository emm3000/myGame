import type { RegionMapReader } from '../ports/RegionMapReader'

export const readLastArea = async (region: number, map: RegionMapReader): Promise<number> =>
  (await map.lastAreaHoldingTown(region)) + 1
