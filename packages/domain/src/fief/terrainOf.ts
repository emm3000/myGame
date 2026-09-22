import type { Coordinates } from './Coordinates'
import type { Terrain } from './Terrain'

const TERRAINS_IN_ROTATION = 3

export const terrainOf = (coordinates: Coordinates): Terrain => {
  const positionInRotation = (coordinates.province - 1) % TERRAINS_IN_ROTATION
  if (positionInRotation === 0) {
    return 'lowlands'
  }
  if (positionInRotation === 1) {
    return 'uplands'
  }
  return 'ridges'
}
