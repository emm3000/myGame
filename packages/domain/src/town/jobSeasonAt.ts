import { seasonAt } from '../season/seasonAt'
import type { Instant } from '../time/Instant'
import type { ProductionPercent, TownSettings } from './TownSettings'

const UNCHANGED_PERCENT = 100

export const unchangedPayPercent: ProductionPercent = {
  money: UNCHANGED_PERCENT,
  food: UNCHANGED_PERCENT,
  power: UNCHANGED_PERCENT,
  material: UNCHANGED_PERCENT,
}

export type JobSeason = {
  readonly roadPercent: number
  readonly payPercent: ProductionPercent
}

export const jobSeasonAt = (instant: Instant, settings: TownSettings): JobSeason => {
  const season = seasonAt(instant, settings)
  if (season === undefined) {
    return { roadPercent: UNCHANGED_PERCENT, payPercent: unchangedPayPercent }
  }
  return {
    roadPercent: settings.seasons.durationPercent[season.kind].road,
    payPercent: settings.seasons.productionPercent[season.kind],
  }
}
