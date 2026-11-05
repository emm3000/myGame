import {
  namesSeasonsFall,
  namesSeasonsSpring,
  namesSeasonsSummer,
  namesSeasonsWinter,
} from '@mygame/catalog'
import type { SeasonKind } from '@mygame/contracts'

const seasonNames: Readonly<Record<SeasonKind, () => string>> = {
  spring: namesSeasonsSpring,
  summer: namesSeasonsSummer,
  fall: namesSeasonsFall,
  winter: namesSeasonsWinter,
}

export function seasonNameOf(season: SeasonKind): string {
  return seasonNames[season]()
}
