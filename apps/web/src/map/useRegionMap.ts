import type { RegionMap } from '@mygame/contracts'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { ApiClient, ApiOutcome, ApiRefusal } from '../api/apiClient'

export type RegionMapState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'refused'; readonly refusal: ApiRefusal }
  | { readonly kind: 'read'; readonly map: RegionMap }

export interface RegionMapHandle {
  readonly state: RegionMapState
  readonly reread: () => void
}

const stateOf = (outcome: ApiOutcome<RegionMap>): RegionMapState =>
  outcome.ok ? { kind: 'read', map: outcome.value } : { kind: 'refused', refusal: outcome.refusal }

export function useRegionMap(apiClient: ApiClient, area: number | undefined): RegionMapHandle {
  const [state, setState] = useState<RegionMapState>({ kind: 'loading' })
  const shownArea = useRef<number | undefined>(area)

  const read = useCallback(async (): Promise<void> => {
    const outcome = await apiClient.regionMap(area)
    if (shownArea.current === area) {
      setState(stateOf(outcome))
    }
  }, [apiClient, area])

  useEffect(() => {
    shownArea.current = area
    setState({ kind: 'loading' })
    void read()
  }, [area, read])

  const reread = useCallback((): void => {
    void read()
  }, [read])

  return { state, reread }
}
