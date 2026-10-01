import type { FiefSettings } from '../ports/BuildingCatalog'
import type { Instant } from '../time/Instant'
import type { DurationPercent } from './SeasonCalendar'
import { seasonAt } from './seasonAt'

const unchangedDurations: DurationPercent = { build: 100, study: 100, train: 100, road: 100 }

export const durationPercentAt = (instant: Instant, settings: FiefSettings): DurationPercent => {
  const season = seasonAt(instant, settings)
  if (season === undefined) {
    return unchangedDurations
  }
  return settings.seasons.durationPercent[season.kind]
}
