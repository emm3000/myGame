import type { BuildingKind } from '@mygame/contracts/town'
import type { ArtTag } from '../art/ArtTag'
import { placeSilhouetteOf } from '../design-system/placeArtOf'

const placesByWord: ReadonlyMap<string, BuildingKind> = new Map([
  ['home', 'homes'],
  ['farm', 'farm'],
  ['factory', 'factory'],
  ['station', 'powerStation'],
  ['storage', 'storage'],
  ['school', 'school'],
  ['office', 'office'],
])

export function wordArtOf(word: string): ReadonlyArray<ArtTag> | undefined {
  const place = placesByWord.get(word)
  return place === undefined ? undefined : placeSilhouetteOf(place, 'on-block')
}
