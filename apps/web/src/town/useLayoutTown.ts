import { useContext } from 'react'
import { TownContext } from './TownContext'
import type { TownHandle } from './useTown'

export function useLayoutTown(): TownHandle {
  const handle = useContext(TownContext)
  if (handle === undefined) {
    throw new Error('useLayoutTown needs the signed-in layout above it')
  }
  return handle
}
