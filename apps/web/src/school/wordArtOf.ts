import type { BuildingKind, TownOverview } from '@mygame/contracts/town'
import { placeArtOf } from '../design-system/placeArtOf'

const placesByWord: ReadonlyMap<string, BuildingKind> = new Map([
  ['home', 'homes'],
  ['farm', 'farm'],
  ['factory', 'factory'],
  ['station', 'powerStation'],
  ['storage', 'storage'],
  ['school', 'school'],
  ['office', 'office'],
])

export function wordArtOf(word: string, buildings: TownOverview['buildings']): string | undefined {
  const place = placesByWord.get(word)
  return place === undefined ? undefined : placeArtOf(place, Math.max(1, buildings[place].level))
}
