import type { HireKind, PlaceHiringOrder, StopHiringOrder } from '@mygame/contracts'
import { useState } from 'react'
import type { ApiClient } from '../api/apiClient'
import type { HireEntries } from './hireCardOf'
import type { TownHandle } from './useTown'
import { type RefusedTownAction, useTownAction } from './useTownAction'

export interface TownHiring {
  readonly entries: HireEntries
  readonly enter: (hire: HireKind, entry: string) => void
  readonly placingHire: HireKind | undefined
  readonly placeRefused: RefusedTownAction<HireKind> | undefined
  readonly place: (order: PlaceHiringOrder) => void
  readonly isStopping: boolean
  readonly stopRefused: RefusedTownAction<StopHiringOrder> | undefined
  readonly stop: (target: StopHiringOrder, onStopped: () => void) => void
}

export function useTownHiring(
  apiClient: ApiClient,
  { adopt, hireEntries, enterHire }: TownHandle,
  readAt: string,
): TownHiring {
  const placing = useTownAction<HireKind>(adopt, readAt)
  const [placedHire, setPlacedHire] = useState<HireKind>()
  const stopping = useTownAction<StopHiringOrder>(adopt, readAt)
  return {
    entries: hireEntries,
    enter: enterHire,
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
