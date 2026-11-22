import type { Instant } from '#time/Instant'
import { seasonPercentsAt } from '../domain/seasonPercentsAt'
import type { ProductionPercent, TownSettings } from '../domain/TownSettings'

export type JobSeason = {
  readonly roadPercent: number
  readonly payPercent: ProductionPercent
}

export const jobSeasonAt = (instant: Instant, settings: TownSettings): JobSeason => {
  const { durationPercent, productionPercent } = seasonPercentsAt(instant, settings)
  return { roadPercent: durationPercent.road, payPercent: productionPercent }
}
