import type { Instant } from '../time/Instant'
import type { ProductionPercent, TownDurationPercent, TownSettings } from './TownSettings'
import { townSeasonAt } from './townSeasonAt'

export type SeasonPercents = {
  readonly productionPercent: ProductionPercent
  readonly durationPercent: TownDurationPercent
}

const UNCHANGED_PERCENT = 100

export const unchangedProductionPercent: ProductionPercent = {
  money: UNCHANGED_PERCENT,
  food: UNCHANGED_PERCENT,
  power: UNCHANGED_PERCENT,
  material: UNCHANGED_PERCENT,
}

const percentsBeforeEpoch: SeasonPercents = {
  productionPercent: unchangedProductionPercent,
  durationPercent: {
    build: UNCHANGED_PERCENT,
    study: UNCHANGED_PERCENT,
    hire: UNCHANGED_PERCENT,
    road: UNCHANGED_PERCENT,
  },
}

export const seasonPercentsAt = (instant: Instant, settings: TownSettings): SeasonPercents => {
  const season = townSeasonAt(instant, settings)
  return season === undefined
    ? percentsBeforeEpoch
    : { productionPercent: season.productionPercent, durationPercent: season.durationPercent }
}
