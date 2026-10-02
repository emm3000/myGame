import type { ProvinceMap } from '@mygame/contracts'
import { useEffect, useState } from 'react'
import type { ApiClient, ApiRefusal } from '../api/apiClient'

export type ProvinceMapState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'refused'; readonly refusal: ApiRefusal }
  | { readonly kind: 'read'; readonly map: ProvinceMap }

export function useProvinceMap(
  apiClient: ApiClient,
  fiefId: string,
  province: number | undefined,
): ProvinceMapState {
  const [state, setState] = useState<ProvinceMapState>({ kind: 'loading' })

  useEffect(() => {
    let isCurrent = true
    setState({ kind: 'loading' })
    void apiClient.provinceMap(fiefId, province).then((outcome) => {
      if (!isCurrent) {
        return
      }
      setState(
        outcome.ok
          ? { kind: 'read', map: outcome.value }
          : { kind: 'refused', refusal: outcome.refusal },
      )
    })
    return () => {
      isCurrent = false
    }
  }, [apiClient, fiefId, province])

  return state
}
