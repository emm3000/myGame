import { townSeasonDays, townSeasonEndsIn } from '@mygame/catalog'
import type { SeasonKind } from '@mygame/contracts'
import { capitalize } from '../design-system/capitalize'
import { seasonNameOf } from '../seasons/seasonNameOf'
import { formatTimeLeft } from '../time/formatTimeLeft'

const secondsPerDay = 86_400

const timeLeftOf = (seconds: number): string => {
  const days = Math.floor(seconds / secondsPerDay)
  return days >= 1 ? townSeasonDays({ days }) : formatTimeLeft(seconds)
}

export function townSeasonEndsInOf(season: SeasonKind, remainingSeconds: number): string {
  return townSeasonEndsIn({
    season: capitalize(seasonNameOf(season)),
    timeLeft: timeLeftOf(remainingSeconds),
  })
}
