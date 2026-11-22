import type { RegionMapReader } from '../domain/RegionMapReader'

export const readLastArea = async (region: number, map: RegionMapReader): Promise<number> =>
  (await map.lastAreaHoldingTown(region)) + 1
