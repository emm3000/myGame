import type { Scaffold } from '@mygame/contracts'
import { useCallback, useRef, useState } from 'react'
import type { ApiClient, ApiRefusal } from '../api/apiClient'

export type SettingChange =
  | { readonly kind: 'untouched' }
  | { readonly kind: 'saving'; readonly scaffold: Scaffold }
  | { readonly kind: 'saved' }
  | { readonly kind: 'refused'; readonly refusal: ApiRefusal }

export interface ScaffoldSetting {
  readonly stored: Scaffold
  readonly change: SettingChange
  readonly pick: (scaffold: Scaffold) => void
}

export function useScaffoldSetting(apiClient: ApiClient, held: Scaffold): ScaffoldSetting {
  const [stored, setStored] = useState<Scaffold>(held)
  const [change, setChange] = useState<SettingChange>({ kind: 'untouched' })
  const isInFlight = useRef(false)

  const save = useCallback(
    async (scaffold: Scaffold): Promise<void> => {
      const outcome = await apiClient.changeScaffold(scaffold)
      isInFlight.current = false
      if (!outcome.ok) {
        setChange({ kind: 'refused', refusal: outcome.refusal })
        return
      }
      setStored(outcome.value.scaffold)
      setChange({ kind: 'saved' })
    },
    [apiClient],
  )

  const pick = useCallback(
    (scaffold: Scaffold): void => {
      if (isInFlight.current) {
        return
      }
      isInFlight.current = true
      setChange({ kind: 'saving', scaffold })
      void save(scaffold)
    },
    [save],
  )

  return { stored, change, pick }
}
