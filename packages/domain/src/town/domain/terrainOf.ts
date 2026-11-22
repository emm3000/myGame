import type { Terrain } from './Terrain'

const TERRAINS_IN_ROTATION = 3

export const terrainOf = (area: number): Terrain => {
  const positionInRotation = (area - 1) % TERRAINS_IN_ROTATION
  if (positionInRotation === 0) {
    return 'fields'
  }
  return positionInRotation === 1 ? 'river' : 'hills'
}
