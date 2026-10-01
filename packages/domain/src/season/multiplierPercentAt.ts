import type { FiefSettings } from '../ports/BuildingCatalog'
import type { ResourceKind } from '../resources/Resources'
import type { Instant } from '../time/Instant'
import { seasonAt } from './seasonAt'

const unchangedRates: Readonly<Record<ResourceKind, number>> = {
  wood: 100,
  stone: 100,
  iron: 100,
  gold: 100,
  food: 100,
}

export const multiplierPercentAt = (
  instant: Instant,
  settings: FiefSettings,
): Readonly<Record<ResourceKind, number>> => {
  const season = seasonAt(instant, settings)
  if (season === undefined) {
    return unchangedRates
  }
  return settings.seasons.multiplierPercent[season.kind]
}
