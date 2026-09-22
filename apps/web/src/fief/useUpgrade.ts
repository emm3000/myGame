import type { BuildingKind, FiefOverview } from '@mygame/contracts'
import { useCallback, useRef, useState } from 'react'
import type { ApiClient, ApiRefusal } from '../api/apiClient'

export interface UpgradeRefusal {
  readonly building: BuildingKind
  readonly refusal: ApiRefusal
}

export interface Upgrade {
  readonly waitingFor: BuildingKind | undefined
  readonly refused: UpgradeRefusal | undefined
  readonly start: (building: BuildingKind) => void
}

export function useUpgrade(apiClient: ApiClient, adopt: (overview: FiefOverview) => void): Upgrade {
  const [waitingFor, setWaitingFor] = useState<BuildingKind>()
  const [refused, setRefused] = useState<UpgradeRefusal>()
  const isWaiting = useRef(false)

  const start = useCallback(
    async (building: BuildingKind): Promise<void> => {
      if (isWaiting.current) {
        return
      }
      isWaiting.current = true
      setWaitingFor(building)
      setRefused(undefined)
      const outcome = await apiClient.enqueueUpgrade(building)
      isWaiting.current = false
      setWaitingFor(undefined)
      if (outcome.ok) {
        adopt(outcome.value)
        return
      }
      setRefused({ building, refusal: outcome.refusal })
    },
    [apiClient, adopt],
  )

  return { waitingFor, refused, start: (building) => void start(building) }
}
