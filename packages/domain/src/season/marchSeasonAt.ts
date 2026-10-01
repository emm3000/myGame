import type { MarchSeason } from '../fief/Fief'
import type { FiefSettings } from '../ports/BuildingCatalog'
import type { Instant } from '../time/Instant'
import { durationPercentAt } from './durationPercentAt'
import { multiplierPercentAt } from './multiplierPercentAt'

export const marchSeasonAt = (instant: Instant, settings: FiefSettings): MarchSeason => ({
  roadPercent: durationPercentAt(instant, settings).road,
  lootPercent: multiplierPercentAt(instant, settings),
})
