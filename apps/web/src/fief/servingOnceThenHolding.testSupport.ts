import type { FiefOverview } from '@mygame/contracts'
import type { ApiClient, ApiOutcome } from '../api/apiClient'

export function servingOnceThenHolding(overview: FiefOverview): ApiClient['fief'] {
  const reads = [overview]
  return (): Promise<ApiOutcome<FiefOverview>> => {
    const next = reads.shift()
    return next === undefined
      ? new Promise(() => undefined)
      : Promise.resolve({ ok: true, value: next })
  }
}
