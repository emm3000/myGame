import type { BuildingKind, FiefOverview } from '@mygame/contracts'
import type { ApiClient, ApiRefusal } from '../api/apiClient'
import { useFiefAction } from './useFiefAction'

export interface UpgradeRefusal {
  readonly building: BuildingKind
  readonly refusal: ApiRefusal
}

export interface Upgrade {
  readonly isWaiting: boolean
  readonly refused: UpgradeRefusal | undefined
  readonly start: (building: BuildingKind) => void
}

export function useUpgrade(
  apiClient: ApiClient,
  fiefId: string,
  adopt: (overview: FiefOverview) => void,
  readAt: string | undefined,
): Upgrade {
  const { isWaiting, refused, run } = useFiefAction<BuildingKind>(adopt, readAt)

  return {
    isWaiting,
    refused: refused && { building: refused.subject, refusal: refused.refusal },
    start: (building) => run(building, () => apiClient.enqueueUpgrade(fiefId, building)),
  }
}
