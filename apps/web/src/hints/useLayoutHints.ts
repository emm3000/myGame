import { useContext } from 'react'
import { HintsContext } from './HintsContext'
import type { HintsHandle } from './useHints'

export function useLayoutHints(): HintsHandle {
  const handle = useContext(HintsContext)
  if (handle === undefined) {
    throw new Error('useLayoutHints needs the signed-in layout above it')
  }
  return handle
}
