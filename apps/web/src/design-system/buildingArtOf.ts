import type { BuildingKind } from '@mygame/contracts'

export function buildingArtOf(building: BuildingKind, level: number): string | undefined {
  if (level <= 0) {
    return undefined
  }
  return `/art/buildings/${building}-${Math.ceil(level / 2)}.png`
}
