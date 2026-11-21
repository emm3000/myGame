import type { SeasonKind } from '@mygame/contracts'
import type { ChromeCatalog } from '../copy/PlayerCopy'

const seasonNames: Readonly<Record<SeasonKind, (catalog: ChromeCatalog) => string>> = {
  spring: (catalog) => catalog.namesSeasonsSpring(),
  summer: (catalog) => catalog.namesSeasonsSummer(),
  fall: (catalog) => catalog.namesSeasonsFall(),
  winter: (catalog) => catalog.namesSeasonsWinter(),
}

export function seasonNameOf(catalog: ChromeCatalog, season: SeasonKind): string {
  return seasonNames[season](catalog)
}
