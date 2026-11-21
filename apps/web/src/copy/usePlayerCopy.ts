import { useContext } from 'react'
import type { PlayerCopy } from './PlayerCopy'
import { PlayerCopyContext } from './PlayerCopyContext'

export function usePlayerCopy(): PlayerCopy {
  const copy = useContext(PlayerCopyContext)
  if (copy === undefined) {
    throw new Error('usePlayerCopy needs the signed-in layout above it')
  }
  return copy
}
