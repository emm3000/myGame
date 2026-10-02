import type { ProvinceMap } from '@mygame/contracts'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { ApiClient, ApiOutcome, ApiRefusal } from '../api/apiClient'

export type ProvinceMapState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'refused'; readonly refusal: ApiRefusal }
  | { readonly kind: 'read'; readonly map: ProvinceMap }

export interface ProvinceMapHandle {
  readonly state: ProvinceMapState
  readonly reread: () => void
}

const stateOf = (outcome: ApiOutcome<ProvinceMap>): ProvinceMapState =>
  outcome.ok ? { kind: 'read', map: outcome.value } : { kind: 'refused', refusal: outcome.refusal }

const addressOf = (fiefId: string, province: number | undefined): string => `${fiefId}/${province}`

export function useProvinceMap(
  apiClient: ApiClient,
  fiefId: string,
  province: number | undefined,
): ProvinceMapHandle {
  const [state, setState] = useState<ProvinceMapState>({ kind: 'loading' })
  const shownAddress = useRef<string>(undefined)

  const read = useCallback(async (): Promise<void> => {
    const outcome = await apiClient.provinceMap(fiefId, province)
    if (shownAddress.current === addressOf(fiefId, province)) {
      setState(stateOf(outcome))
    }
  }, [apiClient, fiefId, province])

  useEffect(() => {
    shownAddress.current = addressOf(fiefId, province)
    setState({ kind: 'loading' })
    void read()
  }, [fiefId, province, read])

  return { state, reread: () => void read() }
}
