import type { SeasonKind } from '@mygame/contracts'
import type { ChromeCatalog } from '../copy/PlayerCopy'
import { capitalize } from '../design-system/capitalize'
import { seasonNameOf } from '../seasons/seasonNameOf'
import { formatTimeLeft } from '../time/formatTimeLeft'

const secondsPerDay = 86_400

const timeLeftOf = (catalog: ChromeCatalog, seconds: number): string => {
  const days = Math.floor(seconds / secondsPerDay)
  return days >= 1 ? catalog.townSeasonDays({ days }) : formatTimeLeft(seconds)
}

export function townSeasonEndsInOf(
  catalog: ChromeCatalog,
  season: SeasonKind,
  remainingSeconds: number,
): string {
  return catalog.townSeasonEndsIn({
    season: capitalize(seasonNameOf(catalog, season)),
    timeLeft: timeLeftOf(catalog, remainingSeconds),
  })
}
