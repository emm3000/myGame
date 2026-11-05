import { fiefSeasonCountdown, fiefSeasonDays } from '@mygame/catalog'
import type { SeasonKind } from '@mygame/contracts'
import { capitalize } from '../design-system/capitalize'
import { formatTimeLeft } from '../time/formatTimeLeft'
import { seasonNameOf } from './seasonNameOf'

const secondsPerDay = 86_400

const seasonAfter: Readonly<Record<SeasonKind, SeasonKind>> = {
  spring: 'summer',
  summer: 'fall',
  fall: 'winter',
  winter: 'spring',
}

const seasonTimeLeft = (seconds: number): string => {
  const days = Math.floor(seconds / secondsPerDay)
  return days >= 1 ? fiefSeasonDays({ days }) : formatTimeLeft(seconds)
}

export function seasonCountdownOf(season: SeasonKind, remainingSeconds: number): string {
  return fiefSeasonCountdown({
    season: capitalize(seasonNameOf(seasonAfter[season])),
    timeLeft: seasonTimeLeft(remainingSeconds),
  })
}
