import type { BuildingKind } from '@mygame/contracts'

const hasArt: Readonly<Record<BuildingKind, boolean>> = {
  sawmill: true,
  quarry: true,
  ironMine: true,
  farm: true,
  warehouse: true,
  library: false,
}

export function buildingArtOf(building: BuildingKind, level: number): string | undefined {
  if (level <= 0 || !hasArt[building]) {
    return undefined
  }
  return `/art/buildings/${building}-${Math.ceil(level / 2)}.png`
}
