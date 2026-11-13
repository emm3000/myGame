import { type Season, seasonAt } from '../season/seasonAt'
import type { Instant } from '../time/Instant'
import type { ProductionPercent, TownDurationPercent, TownSettings } from './TownSettings'

export type TownSeason = Season & {
  readonly productionPercent: ProductionPercent
  readonly durationPercent: TownDurationPercent
}

export const townSeasonAt = (instant: Instant, settings: TownSettings): TownSeason | undefined => {
  const season = seasonAt(instant, settings)
  return season === undefined
    ? undefined
    : {
        ...season,
        productionPercent: settings.seasons.productionPercent[season.kind],
        durationPercent: settings.seasons.durationPercent[season.kind],
      }
}
