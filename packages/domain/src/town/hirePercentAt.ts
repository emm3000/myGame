import { seasonAt } from '../season/seasonAt'
import type { Instant } from '../time/Instant'
import type { TownSettings } from './TownSettings'

const UNCHANGED_PERCENT = 100

export const hirePercentAt = (instant: Instant, settings: TownSettings): number => {
  const season = seasonAt(instant, settings)
  return season === undefined
    ? UNCHANGED_PERCENT
    : settings.seasons.durationPercent[season.kind].hire
}
