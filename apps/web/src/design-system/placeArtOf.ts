import type { BuildingKind } from '@mygame/contracts/town'

export function placeArtOf(place: BuildingKind, level: number): string {
  return `/art/places/${place}-${Math.ceil(Math.max(level, 1) / 2)}.svg`
}
