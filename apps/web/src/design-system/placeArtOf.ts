import type { BuildingKind } from '@mygame/contracts/town'

export function placeArtOf(place: BuildingKind, level: number): string | undefined {
  if (level <= 0) {
    return undefined
  }
  return `/art/places/${place}-${Math.ceil(level / 2)}.svg`
}
