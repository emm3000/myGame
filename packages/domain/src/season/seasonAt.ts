import type { FiefSettings } from '../ports/BuildingCatalog'
import { Instant } from '../time/Instant'
import type { SeasonKind } from './SeasonKind'

export type Season = {
  readonly kind: SeasonKind
  readonly year: number
  readonly endsAt: Instant
}

const MILLISECONDS_PER_DAY = 86_400_000

const SEASONS_PER_YEAR = 4

const seasonKindAt = (positionInYear: number): SeasonKind => {
  switch (positionInYear) {
    case 0:
      return 'spring'
    case 1:
      return 'summer'
    case 2:
      return 'autumn'
    default:
      return 'winter'
  }
}

export const seasonAt = (instant: Instant, settings: FiefSettings): Season | undefined => {
  const { epoch, daysPerSeason } = settings.seasons
  const sinceEpoch = instant.epochMilliseconds - epoch.epochMilliseconds
  if (sinceEpoch < 0) {
    return undefined
  }
  const seasonMilliseconds = daysPerSeason * MILLISECONDS_PER_DAY
  const seasonsElapsed = Math.floor(sinceEpoch / seasonMilliseconds)
  return {
    kind: seasonKindAt(seasonsElapsed % SEASONS_PER_YEAR),
    year: Math.floor(seasonsElapsed / SEASONS_PER_YEAR) + 1,
    endsAt: Instant.fromEpochMilliseconds(
      epoch.epochMilliseconds + (seasonsElapsed + 1) * seasonMilliseconds,
    ),
  }
}
