import type { FiefList } from '@mygame/contracts'
import { useLocation } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import type { ApiClient } from '../api/apiClient'

export type FiefEntries = FiefList['fiefs']

export function useFiefList(apiClient: ApiClient): FiefEntries | undefined {
  const pathname = useLocation({ select: (location) => location.pathname })
  const [fiefs, setFiefs] = useState<FiefEntries | undefined>(undefined)

  // biome-ignore lint/correctness/useExhaustiveDependencies: the list is read again on each navigation, never on a timer (M8)
  useEffect(() => {
    let isCurrent = true
    void apiClient.fiefs().then((outcome) => {
      if (isCurrent) {
        setFiefs(outcome.ok ? outcome.value.fiefs : undefined)
      }
    })
    return () => {
      isCurrent = false
    }
  }, [apiClient, pathname])

  return fiefs
}
