import type { Terrain } from '../../domain/Terrain'
import type { TownCatalog } from '../../domain/TownCatalog'
import type { ProductionPercent } from '../../domain/TownSettings'
import type { Hires } from '../../hiring/domain/Hires'
import type { Stocks } from '../../resources/domain/Stocks'
import { jobPayOfMilliseconds } from './jobPayOfMilliseconds'

const MILLISECONDS_PER_HOUR = 3_600_000

export const jobPayOf = (
  terrain: Terrain,
  team: Hires,
  hours: number,
  catalog: TownCatalog,
  payPercent: ProductionPercent,
): Stocks => jobPayOfMilliseconds(terrain, team, hours * MILLISECONDS_PER_HOUR, catalog, payPercent)
