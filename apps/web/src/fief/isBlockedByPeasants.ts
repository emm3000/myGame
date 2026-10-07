import type { BuildingKind, FiefOverview } from '@mygame/contracts'
import { isQueueFull } from './isQueueFull'

export function isBlockedByPeasants(building: BuildingKind, overview: FiefOverview): boolean {
  const { nextLevel } = overview.buildings[building]
  return (
    nextLevel !== null &&
    !isQueueFull(overview) &&
    nextLevel.peasants > overview.peasants.projectedFree
  )
}
