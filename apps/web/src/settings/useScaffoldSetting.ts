import type { Scaffold } from '@mygame/contracts'
import { useCallback, useRef, useState } from 'react'
import type { ApiClient, ApiRefusal } from '../api/apiClient'

export type ScaffoldChange =
  | { readonly kind: 'untouched' }
  | { readonly kind: 'saving'; readonly scaffold: Scaffold }
  | { readonly kind: 'saved' }
  | { readonly kind: 'refused'; readonly refusal: ApiRefusal }

export interface ScaffoldSetting {
  readonly stored: Scaffold
  readonly change: ScaffoldChange
  readonly pick: (scaffold: Scaffold) => void
}

export function useScaffoldSetting(apiClient: ApiClient, held: Scaffold): ScaffoldSetting {
  const [stored, setStored] = useState<Scaffold>(held)
  const [change, setChange] = useState<ScaffoldChange>({ kind: 'untouched' })
  const isInFlight = useRef(false)

  const pick = useCallback(
    (scaffold: Scaffold): void => {
      if (isInFlight.current) {
        return
      }
      isInFlight.current = true
      setChange({ kind: 'saving', scaffold })
      void apiClient.changeScaffold(scaffold).then((outcome) => {
        isInFlight.current = false
        if (!outcome.ok) {
          setChange({ kind: 'refused', refusal: outcome.refusal })
          return
        }
        setStored(outcome.value.scaffold)
        setChange({ kind: 'saved' })
      })
    },
    [apiClient],
  )

  return { stored, change, pick }
}
