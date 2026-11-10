import type { BuildingKind, StopBuildingWork, TownOverview } from '@mygame/contracts'
import type { ApiClient } from '../api/apiClient'
import { type RefusedTownAction, useTownAction } from './useTownAction'

export interface TownWork {
  readonly isStarting: boolean
  readonly startRefused: RefusedTownAction<BuildingKind> | undefined
  readonly start: (building: BuildingKind) => void
  readonly isStopping: boolean
  readonly stopRefused: RefusedTownAction<StopBuildingWork> | undefined
  readonly stop: (target: StopBuildingWork, onStopped: () => void) => void
}

export function useTownWork(
  apiClient: ApiClient,
  adopt: (overview: TownOverview) => void,
  readAt: string,
): TownWork {
  const starting = useTownAction<BuildingKind>(adopt, readAt)
  const stopping = useTownAction<StopBuildingWork>(adopt, readAt)
  return {
    isStarting: starting.isWaiting,
    startRefused: starting.refused,
    start: (building) => starting.run(building, () => apiClient.startBuildingWork(building)),
    isStopping: stopping.isWaiting,
    stopRefused: stopping.refused,
    stop: (target, onStopped) =>
      stopping.run(target, () => apiClient.stopBuildingWork(target), onStopped),
  }
}
