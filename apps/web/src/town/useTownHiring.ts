import type { HireKind, PlaceHiringOrder, StopHiringOrder, TownOverview } from '@mygame/contracts'
import { useState } from 'react'
import type { ApiClient } from '../api/apiClient'
import { type RefusedTownAction, useTownAction } from './useTownAction'

export interface TownHiring {
  readonly placingHire: HireKind | undefined
  readonly placeRefused: RefusedTownAction<HireKind> | undefined
  readonly place: (order: PlaceHiringOrder) => void
  readonly isStopping: boolean
  readonly stopRefused: RefusedTownAction<StopHiringOrder> | undefined
  readonly stop: (target: StopHiringOrder, onStopped: () => void) => void
}

export function useTownHiring(
  apiClient: ApiClient,
  adopt: (overview: TownOverview) => void,
  readAt: string,
): TownHiring {
  const placing = useTownAction<HireKind>(adopt, readAt)
  const [placedHire, setPlacedHire] = useState<HireKind>()
  const stopping = useTownAction<StopHiringOrder>(adopt, readAt)
  return {
    placingHire: placing.isWaiting ? placedHire : undefined,
    placeRefused: placing.refused,
    place: (order) => {
      if (!placing.isWaiting) {
        setPlacedHire(order.hire)
      }
      placing.run(order.hire, () => apiClient.placeHiringOrder(order))
    },
    isStopping: stopping.isWaiting,
    stopRefused: stopping.refused,
    stop: (target, onStopped) =>
      stopping.run(target, () => apiClient.stopHiringOrder(target), onStopped),
  }
}
