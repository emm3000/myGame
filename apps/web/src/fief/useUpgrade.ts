import type { BuildingKind, FiefOverview } from '@mygame/contracts'
import { useCallback, useRef, useState } from 'react'
import type { ApiClient, ApiRefusal } from '../api/apiClient'

export interface UpgradeRefusal {
  readonly building: BuildingKind
  readonly refusal: ApiRefusal
}

export interface Upgrade {
  readonly isWaiting: boolean
  readonly refused: UpgradeRefusal | undefined
  readonly start: (building: BuildingKind) => void
}

interface RefusalOfRead extends UpgradeRefusal {
  readonly readAt: string | undefined
}

export function useUpgrade(
  apiClient: ApiClient,
  adopt: (overview: FiefOverview) => void,
  readAt: string | undefined,
): Upgrade {
  const [isWaiting, setIsWaiting] = useState(false)
  const [refused, setRefused] = useState<RefusalOfRead>()
  const isInFlight = useRef(false)

  const start = useCallback(
    async (building: BuildingKind): Promise<void> => {
      if (isInFlight.current) {
        return
      }
      isInFlight.current = true
      setIsWaiting(true)
      setRefused(undefined)
      const outcome = await apiClient.enqueueUpgrade(building)
      isInFlight.current = false
      setIsWaiting(false)
      if (outcome.ok) {
        adopt(outcome.value)
        return
      }
      setRefused({ building, refusal: outcome.refusal, readAt })
    },
    [apiClient, adopt, readAt],
  )

  return {
    isWaiting,
    refused: refused?.readAt === readAt ? refused : undefined,
    start: (building) => void start(building),
  }
}
