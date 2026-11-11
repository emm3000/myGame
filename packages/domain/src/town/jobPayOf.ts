import type { Hires } from './Hires'
import { jobPayOfMilliseconds } from './jobPayOfMilliseconds'
import type { Stocks } from './Stocks'
import type { Terrain } from './Terrain'
import type { TownCatalog } from './TownCatalog'
import type { ProductionPercent } from './TownSettings'

const MILLISECONDS_PER_HOUR = 3_600_000

export const jobPayOf = (
  terrain: Terrain,
  team: Hires,
  hours: number,
  catalog: TownCatalog,
  payPercent: ProductionPercent,
): Stocks => jobPayOfMilliseconds(terrain, team, hours * MILLISECONDS_PER_HOUR, catalog, payPercent)
