import { useContext } from 'react'
import { LiveFiefContext } from './LiveFiefContext'
import type { LiveFiefHandle } from './useLiveFief'

export function useLayoutFief(): LiveFiefHandle {
  const handle = useContext(LiveFiefContext)
  if (handle === undefined) {
    throw new Error('useLayoutFief needs the fief layout above it')
  }
  return handle
}
