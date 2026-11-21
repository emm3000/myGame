import type { Hires } from '../hiring/Hires'
import type { TownCatalog } from '../ports/TownCatalog'
import type { Stocks } from '../resources/Stocks'
import type { Terrain } from '../Terrain'
import type { ProductionPercent } from '../TownSettings'
import { jobPayOfMilliseconds } from './jobPayOfMilliseconds'

const MILLISECONDS_PER_HOUR = 3_600_000

export const jobPayOf = (
  terrain: Terrain,
  team: Hires,
  hours: number,
  catalog: TownCatalog,
  payPercent: ProductionPercent,
): Stocks => jobPayOfMilliseconds(terrain, team, hours * MILLISECONDS_PER_HOUR, catalog, payPercent)
