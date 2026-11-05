import {
  namesSeasonsAutumn,
  namesSeasonsSpring,
  namesSeasonsSummer,
  namesSeasonsWinter,
} from '@mygame/catalog'
import type { SeasonKind } from '@mygame/contracts'

const seasonNames: Readonly<Record<SeasonKind, () => string>> = {
  spring: namesSeasonsSpring,
  summer: namesSeasonsSummer,
  autumn: namesSeasonsAutumn,
  winter: namesSeasonsWinter,
}

export function seasonNameOf(season: SeasonKind): string {
  return seasonNames[season]()
}
